import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { UsersModule } from 'apps/api-gateway/src/users/users.module';
import { CustomConfigModule } from 'libs/common/config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [CustomConfigModule, UsersModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
