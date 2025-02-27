import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { lastValueFrom } from 'rxjs';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
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
    userId: string,
  ) => {
    try {
      const user = await lastValueFrom<User | null>(
        this.rabbitMqUserClient.send({ cmd: 'get-user' }, userId),
      );

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

      if (user.premium_expiry && user.is_premium) {
        const now = new Date();

        const premiumExpiry = new Date(user.premium_expiry);

        const diffInMs = premiumExpiry.getTime() - now.getTime();

        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 3)
          throw new RpcException(
            `You have already subscribed to the premium plan, but it's not yet time for renewal. Please wait at least 3 days before the expiration date to renew your premium plan.`,
          );
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: 'Premium Subscription' },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'https://ember-restaurant.vercel.app',
        cancel_url: 'https://ember-restaurant.vercel.app',
        metadata: {
          userId,
        },
      });

      return { url: session.url };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleStripeWebhook = (sig: string, body: any) => {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body as string,
        sig,
        this.configService.get<string>('stripe.webhook_secret') as string,
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const metadata = session.metadata;

        if (!metadata) throw new RpcException('Metadata is empty.');

        const { userId } = metadata;

        this.rabbitMqUserClient.emit('update-premium', userId);
      }

      return { received: true };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
