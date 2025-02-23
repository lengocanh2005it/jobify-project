import { Controller, Get } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getHello(): string {
    return this.reviewsService.getHello();
  }
}
