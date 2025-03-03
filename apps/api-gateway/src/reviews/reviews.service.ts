import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('REVIEWS_SERVICE')
    private readonly rabbitMqReviewClient: ClientProxy,
  ) {}

  public handleCreateReview = (
    createReviewDto: CreateReviewDto,
    userId: string,
  ) => {
    return this.rabbitMqReviewClient.send(
      { cmd: 'create-review' },
      { createReviewDto, userId },
    );
  };

  public handleGetReviews = (user: User) => {
    return this.rabbitMqReviewClient.send({ cmd: 'get-reviews' }, user);
  };

  public handleUpdateReview = (
    updateReviewDto: UpdateReviewDto,
    reviewId: string,
    user: User,
  ) => {
    return this.rabbitMqReviewClient.send(
      { cmd: 'update-review' },
      { updateReviewDto, reviewId, user },
    );
  };

  public handleDeleteReview = (reviewId: string, user: User) => {
    return this.rabbitMqReviewClient.send(
      { cmd: 'delete-review' },
      {
        reviewId,
        user,
      },
    );
  };

  public handleGetReview = (reviewId: string, user: User) => {
    return this.rabbitMqReviewClient.send(
      { cmd: 'get-review' },
      {
        reviewId,
        user,
      },
    );
  };
}
