import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { Transaction } from 'apps/payments/src/entities';
import { User } from 'apps/users/src/entities';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { NotificationTypes } from 'libs/common/constants';
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import Stripe from 'stripe';
import { Between } from 'typeorm';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
  ) {
    this.stripe = new Stripe(
      configService.get<string>('stripe.secret_key') ?? '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
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

          await transactionRepository.update(
            {
              id: transactionId,
            },
            {
              status:
                payment_status === 'paid' ||
                payment_status === 'no_payment_required'
                  ? 'SUCCESS'
                  : 'FAILED',
            },
          );
        }
      } catch (err) {
        console.error(err);
        throw err;
      }
    });
  };

  public handleGetPayments = async () => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      return transactionRepository.find({
        select: {
          id: true,
          amount: true,
          status: true,
          payment_date: true,
          expiry_date: true,
          user: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            is_premium: true,
            premium_expiry: true,
            address: true,
          },
          createdAt: true,
        },
        relations: ['user'],
      });
    });
  };
}
