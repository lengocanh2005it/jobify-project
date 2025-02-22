import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { UsersModule } from 'apps/api-gateway/src/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'apps/api-gateway/src/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/common/filters/http-exception.filter';
import { CustomValidationPipe } from 'libs/common/pipe/validation.pipe';
import { ApiResponseInterceptor } from 'libs/common/interceptors/api-response.interceptor';

@Module({
  imports: [UsersModule, CommonModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule {}
