import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { SearchTransactionsDto } from 'libs/common/dtos';
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

  public handleStripeWebhooks = async (sig: string, body: Buffer) => {
    await lastValueFrom(
      this.rabbitMqPaymentClient.emit(
        { cmd: 'stripe-webhooks' },
        { sig, body },
      ),
    );

    return {
      received: true,
    };
  };

  public handleGetPayments = async (
    searchTransactionsDto?: SearchTransactionsDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqPaymentClient.send(
        { cmd: 'get-payments' },
        searchTransactionsDto,
      ),
    );
  };
}
