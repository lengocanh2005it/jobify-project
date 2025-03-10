import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from 'apps/reviews/src/entities/reviews.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'JOBS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'jobs_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CommonModule,
    TypeOrmModule.forFeature([Review]),
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Reviews Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class ReviewsModule {}
