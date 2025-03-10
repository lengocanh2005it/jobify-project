import configuration from '@app/common/config/configuration';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomValidationPipe } from 'libs/common/pipes/validation.pipe';
import { JwtProvider } from 'libs/common/providers/jwt.provider';
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
  ],
  providers: [CommonService, CustomValidationPipe, JwtProvider],
  exports: [JwtModule, ConfigModule, TypeOrmModule],
})
export class CommonModule {}
