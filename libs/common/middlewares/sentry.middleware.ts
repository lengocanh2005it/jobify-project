import { SentryService } from '@app/common/modules/sentry/sentry.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class SentryMiddleware implements NestMiddleware {
  constructor(private readonly sentryService: SentryService) {}

  use(req: Request, res: Response, next: (error?: any) => void) {
    this.sentryService.startSpan(
      {
        op: 'http.server',
        name: `${req.method} ${req.originalUrl}`,
      },
      (span) => {
        res.on('finish', () => {
          span.setAttribute('http.status_code', res.statusCode);
          span.end();
        });
      },
    );

    next();
  }
}
