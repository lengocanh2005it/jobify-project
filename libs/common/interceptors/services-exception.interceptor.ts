import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ServicesExceptionInterceptor implements NestInterceptor {
  constructor(@Inject('SERVICE_NAME') private readonly serviceName: string) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((exception) => {
        if (exception instanceof RpcException) {
          const error = exception.getError();

          if (typeof error === 'object' && error !== null) {
            return throwError(
              () => new RpcException({ ...error, service: this.serviceName }),
            );
          }

          return throwError(
            () =>
              new RpcException({
                message: String(error),
                service: this.serviceName,
              }),
          );
        }

        return throwError(() => exception);
      }),
    );
  }
}
