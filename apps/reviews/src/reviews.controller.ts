import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { ReviewsService } from './reviews.service';
import { User } from 'apps/users/src/entities/users.entity';

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
  async getReviews(@Payload() user: User) {
    return await this.reviewsService.handleGetReviews(user);
  }

  @MessagePattern({ cmd: 'update-review' })
  async updateReview(
    @Payload('updateReviewDto') updateReviewDto: UpdateReviewDto,
    @Payload('reviewId') reviewId: string,
    @Payload('user') user: User,
  ) {
    return await this.reviewsService.handleUpdateReview(
      updateReviewDto,
      reviewId,
      user,
    );
  }

  @MessagePattern({ cmd: 'delete-review' })
  async deleteReview(
    @Payload('reviewId') reviewId: string,
    @Payload('user') user: User,
  ) {
    return await this.reviewsService.handleDeleteReview(reviewId, user);
  }

  @MessagePattern({ cmd: 'get-review' })
  async getReview(
    @Payload('reviewId') reviewId: string,
    @Payload('user') user: User,
  ) {
    return await this.reviewsService.handleGetReview(reviewId, user);
  }
}
