import { SentryService } from '@app/common/modules/sentry/sentry.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [],
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
