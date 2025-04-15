// main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AuthModule);

  const configService = appContext.get(ConfigService);

  const rabbitmqUrl =
    configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'auth_queue',
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
