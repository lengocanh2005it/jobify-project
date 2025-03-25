import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { Transaction } from 'apps/payments/src/entities';
import { User } from 'apps/users/src/entities';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { ElasticIndexes, NotificationTypes } from 'libs/common/constants';
import { SearchTransactionsDto } from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { Between, Repository } from 'typeorm';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
  ) {
    this.stripe = new Stripe(
      configService.get<string>('stripe.secret_key') ?? '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);
      return this.handleSyncTransactionsToElasticSearch(transactionRepository);
    });
  }

  @Cron('0 0 * * *')
  async handleNotifyExpiredPremiumPackage() {
    this.logger.log(
      'Starting premium subscription expiration notification job...',
    );

    await this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      const twoDaysBefore = subDays(new Date(), 2);

      const transactions = await transactionRepository.find({
        relations: ['user'],
        where: {
          expiry_date: Between(
            startOfDay(twoDaysBefore),
            endOfDay(twoDaysBefore),
          ),
        },
      });

      if (!transactions.length) {
        this.logger.log('No expiration premium package exactly 2 days ago.');
        return;
      }

      const userIds = transactions.map((transaction) => transaction.user.id);

      this.logger.log(
        `Found ${transactions.length} expiring subscriptions. Notifying ${transactions.length} users...`,
      );

      const { title, description, key } = NotificationTypes.PREMIUM_EXPIRING;

      this.rabbitMqNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds,
      });
    });

    this.logger.log('Successfully sent premium expiration reminders to users.');
  }

  public handleCreateCheckoutSession = async (
    amount: number,
    currency: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      if (user.premium_expiry && user.is_premium) {
        const now = new Date();

        const premiumExpiry = new Date(user.premium_expiry);

        const diffInMs = premiumExpiry.getTime() - now.getTime();

        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 3)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              `You have already subscribed to the premium plan, but it's not yet time for renewal. Please wait at least 3 days before the expiration date to renew your premium plan.`,
            ),
          );
      }

      const now = new Date();

      const expiryDate = new Date(now);

      expiryDate.setDate(expiryDate.getDate() + 30);

      let newTransaction = await transactionRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: ['user'],
      });

      if (!newTransaction) {
        newTransaction = transactionRepository.create({
          amount,
          payment_date: new Date(),
          expiry_date: expiryDate,
        });

        newTransaction.user = user;

        await transactionRepository.save(newTransaction);
      } else {
        const newExpiredDate = new Date(newTransaction.expiry_date);

        newExpiredDate.setDate(newExpiredDate.getDate() + 30);

        newTransaction.payment_date = new Date();

        newTransaction.expiry_date = newExpiredDate;

        await transactionRepository.save(newTransaction);
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: this.configService.get<string>('payment_title') ?? '',
                description:
                  this.configService.get<string>('payment_description') ?? '',
                metadata: {
                  plan: 'premium',
                  duration: '1 month',
                  features: 'Priority applications, exclusive job listings',
                },
                images:
                  this.configService
                    .get<string>('payment_images')
                    ?.split(';')
                    .map((url) => url.trim()) ?? [],
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: this.configService.get<string>('payment_success_url'),
        cancel_url: this.configService.get<string>('payment_failed_url'),
        metadata: {
          userId: user.id,
          transactionId: newTransaction.id,
        },
        expires_at: Math.floor(Date.now() / 1000) + 2700,
      });

      this.rabbitMqRedisClient.emit('del-keys-pattern', 'payments');
      this.rabbitMqRedisClient.emit('del-keys-pattern', 'users');
      this.rabbitMqRedisClient.emit('del-keys-pattern', 'admin');

      return { checkout_session_url: session.url };
    });
  };

  public handleStripeWebhook = async (sig: string, body: any) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      try {
        const event = this.stripe.webhooks.constructEvent(
          body as string,
          sig,
          this.configService.get<string>('stripe.webhook_secret') as string,
        );

        if (event.type === 'checkout.session.completed') {
          const { payment_status, metadata } = event.data.object;

          if (!metadata)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.BAD_REQUEST,
                'Metadata is empty.',
              ),
            );

          const { userId, transactionId } = metadata;

          if (
            payment_status === 'paid' ||
            payment_status === 'no_payment_required'
          ) {
            this.rabbitMqUserClient.emit('update-premium', userId);
          }

          const findTransaction = await transactionRepository.findOne({
            where: {
              id: transactionId,
            },
            relations: ['user'],
          });

          if (!findTransaction)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.NOT_FOUND,
                `Transaction with id: '${transactionId}' not found.`,
              ),
            );

          findTransaction.status =
            payment_status === 'paid' ||
            payment_status === 'no_payment_required'
              ? 'SUCCESS'
              : 'FAILED';

          await transactionRepository.save(findTransaction);

          await this.elasticsearchService.index({
            index: ElasticIndexes.TRANSACTIONS,
            id: transactionId,
            body: {
              id: findTransaction.id,
              amount: findTransaction.amount,
              status: findTransaction.status,
              payment_date: findTransaction.payment_date,
              expiry_date: findTransaction.expiry_date,
              user: {
                id: findTransaction.user.id,
                full_name: findTransaction.user.full_name,
                email: findTransaction.user.email,
                phone_number: findTransaction.user.phone_number,
                is_premium: findTransaction.user.is_premium,
                premium_expiry: findTransaction.user.premium_expiry,
                address: findTransaction.user.address,
              },
            },
          });

          this.rabbitMqRedisClient.emit('del-keys-pattern', 'payments');
          this.rabbitMqRedisClient.emit('del-keys-pattern', 'admin');
          this.rabbitMqRedisClient.emit('del-keys-pattern', 'users');
        }
      } catch (err) {
        console.error(err);
        throw err;
      }
    });
  };

  public handleGetPayments = async (
    searchTransactionsDto?: SearchTransactionsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const must: any[] = [];

        if (searchTransactionsDto) {
          if (searchTransactionsDto.status) {
            must.push({
              match: { status: searchTransactionsDto.status },
            });
          }

          if (
            searchTransactionsDto.paymentDateAfter ||
            searchTransactionsDto.paymentDateBefore
          ) {
            const rangeFilter: any = { payment_date: {} };

            if (searchTransactionsDto.paymentDateAfter) {
              rangeFilter.payment_date.gte =
                searchTransactionsDto.paymentDateAfter;
            }

            if (searchTransactionsDto.paymentDateBefore) {
              rangeFilter.payment_date.lte =
                searchTransactionsDto.paymentDateBefore;
            }

            must.push({ range: rangeFilter });
          }

          if (
            searchTransactionsDto.expiryDateAfter ||
            searchTransactionsDto.expiryDateBefore
          ) {
            const rangeFilter: any = { expiry_date: {} };

            if (searchTransactionsDto.expiryDateAfter) {
              rangeFilter.expiry_date.gte =
                searchTransactionsDto.expiryDateAfter;
            }

            if (searchTransactionsDto.expiryDateBefore) {
              rangeFilter.expiry_date.lte =
                searchTransactionsDto.expiryDateBefore;
            }

            must.push({ range: rangeFilter });
          }

          if (searchTransactionsDto.user_email) {
            must.push({
              match: {
                'user.email.keyword': searchTransactionsDto.user_email,
              },
            });
          }

          if (searchTransactionsDto.user_fullName) {
            must.push({
              match: {
                'user.full_name': searchTransactionsDto.user_fullName,
              },
            });
          }

          if (searchTransactionsDto.user_phoneNumber) {
            must.push({
              wildcard: {
                'user.phone_number.keyword': `*${searchTransactionsDto.user_phoneNumber}*`,
              },
            });
          }
        }

        const queryBody = {
          query: {
            bool: {
              must,
            },
          },
        };

        const { hits } = await this.elasticsearchService.search({
          index: ElasticIndexes.TRANSACTIONS,
          body: queryBody,
        });

        return hits.hits.map((hit) => hit._source);
      } catch (err) {
        if (err?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error: ', err);
        throw err;
      }
    });
  };

  private handleSyncTransactionsToElasticSearch = async (
    transactionRepository: Repository<Transaction>,
  ) => {
    const transactions = await transactionRepository.find({
      relations: ['user'],
    });

    const bulkBody = transactions.flatMap((transaction) => [
      { index: { _index: ElasticIndexes.TRANSACTIONS, _id: transaction.id } },
      {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        payment_date: transaction.payment_date,
        expiry_date: transaction.expiry_date,
        user: {
          id: transaction.user.id,
          full_name: transaction.user.full_name,
          email: transaction.user.email,
          phone_number: transaction.user.phone_number,
          is_premium: transaction.user.is_premium,
          premium_expiry: transaction.user.premium_expiry,
          address: transaction.user.address,
        },
      },
    ]);

    if (!bulkBody.length) {
      console.warn(
        '⚠️ Bulk request body is empty, skipping Elasticsearch sync.',
      );
      return;
    }

    await this.elasticsearchService.bulk({
      index: ElasticIndexes.TRANSACTIONS,
      body: bulkBody,
    });
  };

  public handleCalculateStatisticsRevenue = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      const totalUsers = await lastValueFrom<number>(
        this.rabbitMqUserClient.send({ cmd: 'get-total-users' }, {}),
      );

      const { totalRevenue } = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: 'SUCCESS' })
        .select('SUM(transaction.amount)', 'totalRevenue')
        .getRawOne();

      const { revenueLast7Days } = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: 'SUCCESS' })
        .andWhere('transaction.payment_date >= :date', {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })
        .select('SUM(transaction.amount)', 'revenueLast7Days')
        .getRawOne();

      const { premiumUserCount } = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: 'SUCCESS' })
        .select('COUNT(DISTINCT transaction.user_id)', 'premiumUserCount')
        .getRawOne();

      const newPremiumUserLast7Days = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: 'SUCCESS' })
        .andWhere('transaction.payment_date >= :date', {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })
        .groupBy('transaction.user_id')
        .having('MIN(transaction.payment_date) >= :date', {
          date: new Date(Date.now() - 7 * 24 * 24 * 60 * 60 * 1000),
        })
        .select(
          'COUNT(DISTINCT transaction.user_id)',
          'newPremiumUserLast7Days',
        )
        .getRawOne();

      const conversionRate =
        ((parseInt((premiumUserCount as string) ?? '0') || 0) /
          (totalUsers || 1)) *
        100;

      const monthlyRevenue = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.status = :status', { status: 'SUCCESS' })
        .select([
          "DATE_FORMAT(transaction.payment_date, '%Y-%m') AS month",
          'SUM(transaction.amount) AS revenue',
        ])
        .groupBy("DATE_FORMAT(transaction.payment_date, '%Y-%m')")
        .orderBy("DATE_FORMAT(transaction.payment_date, '%Y-%m')", 'ASC')
        .getRawMany();

      const formattedMonthlyRevenue = monthlyRevenue.reduce((acc, row) => {
        acc[row.month] = parseFloat((row.revenue as string) ?? '0');
        return acc;
      }, {});

      return {
        totalRevenue: parseFloat((totalRevenue as string) ?? '0') || 0,
        revenueLast7Days: parseFloat((revenueLast7Days as string) ?? '0') || 0,
        totalUsers,
        premiumUserCount: parseInt((premiumUserCount as string) ?? 0) || 0,
        newPremiumUserLast7Days:
          parseInt((newPremiumUserLast7Days as string) ?? 0) || 0,
        conversionRate,
        monthlyRevenue: formattedMonthlyRevenue,
      };
    });
  };
}
