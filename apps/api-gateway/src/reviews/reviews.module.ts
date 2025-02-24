import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReviewsController } from 'apps/api-gateway/src/reviews/reviews.controller';
import { ReviewsService } from 'apps/api-gateway/src/reviews/reviews.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REVIEWS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'reviews_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
