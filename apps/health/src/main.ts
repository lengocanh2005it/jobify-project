import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { HealthModule } from './health.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(HealthModule);

  const configService = appContext.get(ConfigService);

  const rabbitmqUrl =
    configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    HealthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'health_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.listen();
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap: ', err);
});
