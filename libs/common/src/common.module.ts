import configuration from '@app/common/config/configuration';
import { RabbitMqModule, SentryModule } from '@app/common/modules';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { createKeyv } from '@keyv/redis';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { SkipThrottle, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import {
  DEFAULT_CACHE_TTL,
  DEFAULT_THROTTLER_LIMIT,
  DEFAULT_THROTTLER_TTL,
  GOOGLE_RECAPTCHA_SCORE,
  HTTP_MODULE_MAX_REDIRECT,
  HTTP_MODULE_TIMEOUT,
} from 'libs/common/constants';
import { entities } from 'libs/common/entities';
import { CustomValidationPipe } from 'libs/common/pipes';
import {
  FacebookProvider,
  GoogleProvider,
  JwtProvider,
  LinkedInProvider,
  TransactionsProvider,
} from 'libs/common/providers';
import * as multer from 'multer';
import { LoggerModule } from 'nestjs-pino';
import { CommonService } from './common.service';
import { TwilioModule } from 'nestjs-twilio';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_secret_key'),
        signOptions: {
          expiresIn: configService.get('access_token_life') as string,
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        port: configService.get<number>('database.port'),
        host: configService.get<string>('database.host'),
        entities,
        synchronize: true,
        logging: false,
      }),
    }),
    MulterModule.register({
      storage: multer.diskStorage({
        destination: './libs/common/files',
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}-${sanitizedOriginalName}`);
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: DEFAULT_THROTTLER_TTL, limit: DEFAULT_THROTTLER_LIMIT },
      ],
    }),
    ScheduleModule.forRoot(),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>('elasticsearch.url', ''),
      }),
    }),
    HttpModule.register({
      timeout: HTTP_MODULE_TIMEOUT,
      maxRedirects: HTTP_MODULE_MAX_REDIRECT,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [
          createKeyv(
            configService.get<string>('redis.url', 'redis://localhost:6379'),
          ),
        ],
        ttl: DEFAULT_CACHE_TTL,
      }),
    }),
    RabbitMqModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
        },
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
        },
        autoLogging: false,
      },
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secretKey: configService.get<string>('google_recaptcha.secret_key', ''),
        response: (req) => req.headers.recaptcha,
        skipIf: configService.get<string>('node_env', '') !== 'production',
        actions: ['sign-up', 'sign-in'],
        score: GOOGLE_RECAPTCHA_SCORE,
      }),
    }),
    SentryModule,
    StripeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get<string>('stripe.secret_key', ''),
        webhookConfig: {
          stripeSecrets: {
            account: configService.get<string>('stripe.webhook_secret', ''),
            accountTest: configService.get<string>('stripe.webhook_secret', ''),
          },
          requestBodyProperty: 'rawBody',
          decorators: [SkipThrottle()],
        },
      }),
    }),
    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        accountSid: configService.get<string>('twilio.account_sid', ''),
        authToken: configService.get<string>('twilio.auth_token', ''),
      }),
    }),
  ],
  providers: [
    CommonService,
    CustomValidationPipe,
    JwtProvider,
    GoogleProvider,
    LinkedInProvider,
    FacebookProvider,
    TransactionsProvider,
  ],
  exports: [
    JwtModule,
    ConfigModule,
    TypeOrmModule,
    MulterModule,
    GoogleProvider,
    LinkedInProvider,
    FacebookProvider,
    ThrottlerModule,
    ScheduleModule,
    TransactionsProvider,
    ElasticsearchModule,
    CacheModule,
    HttpModule,
    RabbitMqModule,
    BullModule,
    LoggerModule,
    GoogleRecaptchaModule,
    SentryModule,
    StripeModule,
    TwilioModule,
  ],
})
export class CommonModule {}
