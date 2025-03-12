import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { RESPONSE_MESSAGE } from 'libs/common/decorators/response-message.decorator';
import { map, Observable } from 'rxjs';

export type ApiResponseType<T = any> = {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
};

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<ApiResponseType> | Promise<Observable<ApiResponseType>> {
    const customMessage: string = this.reflector.get<string>(
      RESPONSE_MESSAGE,
      context.getHandler(),
    );

    const defaultMessage: string = 'Success';

    const message: string = customMessage ?? defaultMessage;

    const statusCode: number = context
      .switchToHttp()
      .getResponse<Response>().statusCode;

    const response = context.switchToHttp().getResponse<Response>();

    if (response.locals) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => ({
        statusCode,
        message,
        ...(data ? { data } : {}),
      })),
    );
  }
}
