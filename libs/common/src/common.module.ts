import configuration from '@app/common/config/configuration';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DEFAULT_THROTTLER_LIMIT,
  DEFAULT_THROTTLER_TTL,
  HTTP_MODULE_MAX_REDIRECT,
  HTTP_MODULE_TIMEOUT,
} from 'libs/common/constants';
import { CustomValidationPipe } from 'libs/common/pipes';
import {
  FacebookProvider,
  GoogleProvider,
  JwtProvider,
  LinkedInProvider,
  TransactionsProvider,
} from 'libs/common/providers';
import * as multer from 'multer';
import { CommonService } from './common.service';

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
        entities: ['dist/**/*.entity.js'],
        migrations: [
          'dist/apps/api-gateway/apps/api-gateway/src/config/migrations/*.js',
        ],
        synchronize: false,
        logging: false,
      }),
    }),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
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
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
    HttpModule.register({
      timeout: HTTP_MODULE_TIMEOUT,
      maxRedirects: HTTP_MODULE_MAX_REDIRECT,
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
  ],
})
export class CommonModule {}
