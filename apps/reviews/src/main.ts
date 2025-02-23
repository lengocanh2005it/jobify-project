import { NestFactory } from '@nestjs/core';
import { ReviewsModule } from './reviews.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReviewsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'reviews_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.listen();
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
});
