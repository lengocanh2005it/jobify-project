import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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

  public handleGetReviews = () => {
    return this.rabbitMqReviewClient.send({ cmd: 'get-reviews' }, {});
  };

  public handleUpdateReview = (
    updateReviewDto: UpdateReviewDto,
    reviewId: string,
  ) => {
    return this.rabbitMqReviewClient.send(
      { cmd: 'update-review' },
      { updateReviewDto, reviewId },
    );
  };

  public handleDeleteReview = (reviewId: string) => {
    return this.rabbitMqReviewClient.send({ cmd: 'delete-review' }, reviewId);
  };

  public handleGetReview = (reviewId: string) => {
    return this.rabbitMqReviewClient.send({ cmd: 'get-review' }, reviewId);
  };
}
