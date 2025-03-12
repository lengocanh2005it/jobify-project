import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class ServicesExceptionInterceptor implements NestInterceptor {
  constructor(@Inject('SERVICE_NAME') private readonly serviceName: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((exception) => {
        console.error(`❌ Exception in ${this.serviceName}:`, exception);

        let error = exception.getError?.() ?? exception;

        if (typeof error === 'object' && error !== null && 'error' in error) {
          error = error.error;
        }

        if (typeof error === 'object' && error !== null) {
          if ('statusCode' in error && 'message' in error) {
            return throwError(
              () =>
                new RpcException({
                  ...(error as object),
                  service: this.serviceName,
                }),
            );
          }
        }

        return throwError(
          () =>
            new RpcException({
              statusCode: 500,
              message:
                typeof error === 'string' ? error : 'Internal Server Error',
              service: this.serviceName,
            }),
        );
      }),
    );
  }
}
