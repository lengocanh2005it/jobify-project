import { CommonModule } from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AdminModule } from 'apps/api-gateway/src/admin/admin.module';
import { ApplicationsModule } from 'apps/api-gateway/src/applications/applications.module';
import { AuthModule } from 'apps/api-gateway/src/auth/auth.module';
import { InterviewsModule } from 'apps/api-gateway/src/interviews/interviews.module';
import { JobsModule } from 'apps/api-gateway/src/jobs/jobs.module';
import { ConversationsModule } from 'apps/api-gateway/src/messages/conversations/conversations.module';
import { MessagesModule } from 'apps/api-gateway/src/messages/messages.module';
import { PaymentsModule } from 'apps/api-gateway/src/payments/payments.module';
import { ReportsModule } from 'apps/api-gateway/src/reports/reports.module';
import { ReviewsModule } from 'apps/api-gateway/src/reviews/reviews.module';
import { SearchModule } from 'apps/api-gateway/src/search/search.module';
import { SseModule } from 'apps/api-gateway/src/sse/sse.module';
import { UploadsModule } from 'apps/api-gateway/src/uploads/uploads.module';
import { UsersModule } from 'apps/api-gateway/src/users/users.module';
import { NotificationsModule } from 'apps/notifications/src/notifications.module';
import { HttpExceptionFilter } from 'libs/common/filters';
import { CustomThrottlerGuard } from 'libs/common/guards';
import { ApiResponseInterceptor } from 'libs/common/interceptors';
import { LoggerMiddleware, SentryMiddleware } from 'libs/common/middlewares';
import { CustomValidationPipe } from 'libs/common/pipes';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from 'apps/api-gateway/src/health/health.module';

@Module({
  imports: [
    UsersModule,
    CommonModule,
    AuthModule,
    JobsModule,
    ApplicationsModule,
    ReviewsModule,
    PaymentsModule,
    UploadsModule,
    InterviewsModule,
    NotificationsModule,
    MessagesModule,
    ConversationsModule,
    AdminModule,
    ReportsModule,
    SearchModule,
    SseModule,
    HealthModule,
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
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
