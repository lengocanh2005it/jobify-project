import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'apps/payments/src/entities';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CommonModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Payments Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class PaymentsModule {}
