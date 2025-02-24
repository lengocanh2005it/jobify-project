import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @MessagePattern({ cmd: 'create-review' })
  async createReview(
    @Payload('createReviewDto') createReviewDto: CreateReviewDto,
    @Payload('userId') userId: string,
  ) {
    return await this.reviewsService.handleCreateReview(
      createReviewDto,
      userId,
    );
  }

  @MessagePattern({ cmd: 'get-reviews' })
  async getReviews() {
    return await this.reviewsService.handleGetReviews();
  }

  @MessagePattern({ cmd: 'update-review' })
  async updateReview(
    @Payload('updateReviewDto') updateReviewDto: UpdateReviewDto,
    @Payload('reviewId') reviewId: string,
  ) {
    return await this.reviewsService.handleUpdateReview(
      updateReviewDto,
      reviewId,
    );
  }

  @MessagePattern({ cmd: 'delete-review' })
  async deleteReview(@Payload() reviewId: string) {
    return await this.reviewsService.handleDeleteReview(reviewId);
  }

  @MessagePattern({ cmd: 'get-review' })
  async getReview(@Payload() reviewId: string) {
    return await this.reviewsService.handleDeleteReview(reviewId);
  }
}
