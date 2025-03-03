import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'apps/payments/src/entities/transactions.entity';
import { User } from 'apps/users/src/entities/users.entity';
import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.stripe = new Stripe(
      configService.get<string>('stripe.secret_key') ?? '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  public handleCreateCheckoutSession = async (
    amount: number,
    currency: string,
    user: User,
  ) => {
    try {
      if (user.premium_expiry && user.is_premium) {
        const now = new Date();

        const premiumExpiry = new Date(user.premium_expiry);

        const diffInMs = premiumExpiry.getTime() - now.getTime();

        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 3)
          throw new RpcException(
            `You have already subscribed to the premium plan, but it's not yet time for renewal. 
            Please wait at least 3 days before the expiration date to renew your premium plan.`,
          );
      }

      const now = new Date();

      const expiryDate = new Date(now);

      expiryDate.setDate(expiryDate.getDate() + 30);

      let newTransaction = await this.transactionRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: ['user'],
      });

      if (!newTransaction) {
        newTransaction = this.transactionRepository.create({
          amount,
          payment_date: new Date(),
          expiry_date: expiryDate,
        });

        await this.transactionRepository.save(newTransaction);

        await this.dataSource
          .createQueryBuilder()
          .relation(Transaction, 'user')
          .of(newTransaction.id)
          .set(user.id);
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
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleStripeWebhook = async (sig: string, body: any) => {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body as string,
        sig,
        this.configService.get<string>('stripe.webhook_secret') as string,
      );

      if (event.type === 'checkout.session.completed') {
        const { payment_status, metadata } = event.data.object;

        if (!metadata) throw new RpcException('Metadata is empty.');

        const { userId, transactionId } = metadata;

        if (
          payment_status === 'paid' ||
          payment_status === 'no_payment_required'
        ) {
          this.rabbitMqUserClient.emit('update-premium', userId);
        }

        await this.transactionRepository.update(
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
  };

  public handleGetPayments = async () => {
    try {
      return await this.transactionRepository.find({
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
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
