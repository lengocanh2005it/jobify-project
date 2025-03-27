import { HttpStatus } from '@nestjs/common';

export const generateRpcExceptionResponse = (
  statusCode: HttpStatus,
  message: string | Record<string, any>,
) => {
  let parsedMessage = message;

  if (typeof message === 'string') {
    try {
      const json = JSON.parse(message);
      if (typeof json === 'object' && json !== null) {
        parsedMessage = json;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return {
    statusCode,
    message: parsedMessage,
  };
};
