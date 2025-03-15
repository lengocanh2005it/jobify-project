import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('PAYMENTS_SERVICE')
    private readonly rabbitMqPaymentClient: ClientProxy,
  ) {}

  public handleCreatePayment = async (user: User) => {
    return await lastValueFrom(
      this.rabbitMqPaymentClient.send({ cmd: 'create-payment' }, user),
    );
  };

  public handleStripeWebhooks = async (sig: string, body: string) => {
    const rawBody = Buffer.isBuffer(body)
      ? body.toString()
      : JSON.stringify(body);

    return await lastValueFrom(
      this.rabbitMqPaymentClient.emit(
        { cmd: 'stripe-webhooks' },
        { sig, body: rawBody },
      ),
    );
  };

  public handleGetPayments = async () => {
    return await lastValueFrom(
      this.rabbitMqPaymentClient.send({ cmd: 'get-payments' }, {}),
    );
  };
}
