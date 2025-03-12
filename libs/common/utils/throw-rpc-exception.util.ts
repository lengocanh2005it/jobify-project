import { HttpStatus } from '@nestjs/common';

export const generateRpcExceptionResponse = (
  statusCode: HttpStatus,
  message: string,
) => {
  return {
    statusCode,
    message,
  };
};
