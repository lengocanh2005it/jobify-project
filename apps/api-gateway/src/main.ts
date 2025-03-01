import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/payments/stripe/webhooks',
    express.raw({ type: 'application/json' }),
  );

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('origin_fe_url'),
    credentials: true,
  });

  const PORT = configService.get<number>('port');

  const config = new DocumentBuilder()
    .setTitle('JOBIFY BACKEND')
    .setDescription('Find Your Dream Job Easily & Quickly')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1', app, documentFactory);

  await app.listen(PORT ?? 3001, () => {
    console.log(`API Gateway is running at PORT ${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
});
