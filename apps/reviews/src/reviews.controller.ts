import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { ReviewsService } from './reviews.service';
import { User } from 'apps/users/src/entities/users.entity';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @MessagePattern({ cmd: 'create-review' })
  async createReview(
    @Payload('createReviewDto') createReviewDto: CreateReviewDto,
    @Payload('userId') userId: string,
  ) {
    return this.reviewsService.handleCreateReview(createReviewDto, userId);
  }

  @MessagePattern({ cmd: 'get-reviews' })
  async getReviews(@Payload() user: User) {
    return this.reviewsService.handleGetReviews(user);
  }

  @MessagePattern({ cmd: 'update-review' })
  async updateReview(
    @Payload('updateReviewDto') updateReviewDto: UpdateReviewDto,
    @Payload('reviewId') reviewId: string,
    @Payload('user') user: User,
  ) {
    return this.reviewsService.handleUpdateReview(
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
    return this.reviewsService.handleDeleteReview(reviewId, user);
  }

  @MessagePattern({ cmd: 'get-review' })
  async getReview(
    @Payload('reviewId') reviewId: string,
    @Payload('user') user: User,
  ) {
    return this.reviewsService.handleGetReview(reviewId, user);
  }
}
