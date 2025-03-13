import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RpcExceptionType } from 'libs/common/utils';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal Server Error';
    let serviceName = 'API Gateway';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        'message' in response &&
        'statusCode' in response
      ) {
        message = response.message as string;
        status = response.statusCode as number;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else if (typeof exception === 'object' && exception) {
      const err = exception as RpcExceptionType & { service?: string };
      status = err.statusCode ?? 500;
      message = err.message ?? 'Internal Server Error';
      serviceName = err.service ?? 'Unknown Service';
    }

    console.error({
      service: serviceName,
      statusCode: status,
      message: message,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
