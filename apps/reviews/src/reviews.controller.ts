import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CreateReviewDto,
  SearchReviewsDto,
  UpdateReviewDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { ReviewsService } from './reviews.service';

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
  async getReviews(
    @Payload('user') user: User,
    @Payload('searchReviewsDto') searchReviewsDto?: SearchReviewsDto,
  ) {
    return this.reviewsService.handleGetReviews(user, searchReviewsDto);
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
