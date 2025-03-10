import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    CommonModule,
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'redis_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Uploads Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class EmailsModule {}
