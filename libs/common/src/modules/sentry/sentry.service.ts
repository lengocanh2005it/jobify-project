import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { SENTRY_TRACES_RATE } from 'libs/common/constants';

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    Sentry.init({
      dsn: this.configService.get<string>('sentry.dsn', ''),
      tracesSampleRate: SENTRY_TRACES_RATE,
    });
  }

  async onModuleDestroy() {
    await Sentry.close();
  }

  public captureException = (error: any) => {
    Sentry.captureException(error);
  };

  public startSpan(
    options: { name: string; op?: string },
    callback?: (span: Sentry.Span) => void,
  ) {
    const span = Sentry.startSpan(options, (span) => {
      if (callback) {
        callback(span);
      }
      span.end();
    });
    return span;
  }
}
