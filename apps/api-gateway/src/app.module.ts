import { CommonModule } from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApplicationsModule } from 'apps/api-gateway/src/applications/applications.module';
import { AuthModule } from 'apps/api-gateway/src/auth/auth.module';
import { JobsModule } from 'apps/api-gateway/src/jobs/jobs.module';
import { ReviewsModule } from 'apps/api-gateway/src/reviews/reviews.module';
import { UsersModule } from 'apps/api-gateway/src/users/users.module';
import { HttpExceptionFilter } from 'libs/common/filters';
import { ApiResponseInterceptor } from 'libs/common/interceptors';
import { LoggerMiddleware } from 'libs/common/middlewares';
import { CustomValidationPipe } from 'libs/common/pipe';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    UsersModule,
    CommonModule,
    AuthModule,
    JobsModule,
    ApplicationsModule,
    ReviewsModule,
  ],
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
