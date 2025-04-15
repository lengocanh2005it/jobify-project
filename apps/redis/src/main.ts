import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(RedisModule);

  const configService = appContext.get(ConfigService);

  const rabbitmqUrl =
    configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RedisModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'redis_queue',
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
