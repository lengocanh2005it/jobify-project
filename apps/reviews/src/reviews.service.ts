import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  getHello(): string {
    return 'Hello World!';
  }
}
