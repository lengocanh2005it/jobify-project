import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AdminModule } from './admin.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AdminModule);

  const configService = appContext.get(ConfigService);

  const rabbitmqUrl =
    configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AdminModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'admin_queue',
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
