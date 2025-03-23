import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setViewEngine('pug');
  app.setBaseViewsDir(path.join(process.cwd(), 'libs', 'common', 'views'));

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

  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('JOBIFY BACKEND')
    .setDescription('Find Your Dream Job Easily & Quickly')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  await app.listen(PORT ?? 3001, () => {
    console.log(`API Gateway is running at PORT ${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
});
