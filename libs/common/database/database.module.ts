import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomConfigModule } from 'libs/common/config/config.module';

@Global()
@Module({
  imports: [
    CustomConfigModule,
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
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class DatabaseModule {}
