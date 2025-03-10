import { Injectable, ValidationPipe } from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
    });
  }
}
