import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CustomValidationPipe } from 'libs/common/pipe/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('port');

  app.useGlobalPipes(new CustomValidationPipe());

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
