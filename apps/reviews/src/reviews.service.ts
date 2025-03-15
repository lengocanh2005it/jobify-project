import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Company } from 'apps/jobs/src/entities';
import { Review } from 'apps/reviews/src/entities';
import { User } from 'apps/users/src/entities';
import { NotificationTypes } from 'libs/common/constants';
import { CreateReviewDto, UpdateReviewDto } from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMQNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
  ) {}

  public handleCreateReview = async (
    createReviewDto: CreateReviewDto,
    userId: string,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);

      const {
        company_id: companyId,
        comment,
        ratings_number,
      } = createReviewDto;

      const company = await lastValueFrom<Company | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'get-company' }, companyId),
      );

      if (!company)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Company with id: '${companyId}' not found.`,
          ),
        );

      let newReview = await reviewRepository.findOne({
        where: {
          candidate: { id: userId },
          comment,
          ratings_number,
        },
        relations: ['candidate'],
      });

      if (newReview)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `You have already reviewed this company and cannot submit another review.`,
          ),
        );

      newReview = reviewRepository.create({ comment, ratings_number });

      await reviewRepository.save(newReview);

      await reviewRepository
        .createQueryBuilder()
        .relation(Review, 'candidate')
        .of(newReview.id)
        .set(userId);

      await reviewRepository
        .createQueryBuilder()
        .relation(Review, 'company')
        .of(newReview.id)
        .set(companyId);

      const { title, description, key } = NotificationTypes.NEW_REVIEW_RECEIVED;

      this.rabbitMQNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: company.recruiters.map((re) => re.id),
      });

      return reviewRepository.findOne({
        where: { id: newReview.id },
        relations: ['candidate', 'company'],
        select: {
          id: true,
          ratings_number: true,
          comment: true,
          company: {
            name: true,
            bio: true,
            id: true,
            address: true,
            website: true,
          },
          candidate: {
            id: true,
            email: true,
            phone_number: true,
            full_name: true,
            bio: true,
          },
        },
      });
    });
  };

  public handleGetReviews = async (user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);

      const { role, company } = user;

      return reviewRepository.find({
        relations: ['candidate', 'company'],
        where:
          role.name === 'recruiter'
            ? {
                company: {
                  id: company.id,
                },
              }
            : {},
        select: {
          id: true,
          ratings_number: true,
          comment: true,
          company: {
            name: true,
            bio: true,
            id: true,
            address: true,
            website: true,
          },
          candidate: {
            id: true,
            email: true,
            phone_number: true,
            full_name: true,
            bio: true,
          },
        },
      });
    });
  };

  public handleUpdateReview = async (
    updateReviewDto: UpdateReviewDto,
    reviewId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);

      const { role, id } = user;

      const review = await reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['candidate'],
      });

      if (!review)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Review with id: '${reviewId}' not found.`,
          ),
        );

      if (role.name === 'candidate' && review.candidate.id !== id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only update the review that belongs to you.`,
          ),
        );

      await reviewRepository.update({ id: reviewId }, updateReviewDto);

      return reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['candidate', 'company'],
        select: {
          id: true,
          ratings_number: true,
          comment: true,
          company: {
            name: true,
            bio: true,
            id: true,
            address: true,
            website: true,
          },
          candidate: {
            id: true,
            email: true,
            phone_number: true,
            full_name: true,
            bio: true,
          },
        },
      });
    });
  };

  public handleDeleteReview = async (reviewId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);

      const { id, role } = user;

      const review = await reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['company', 'company.recruiters'],
      });

      if (!review)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Review with id: '${reviewId}' not found.`,
          ),
        );

      if (role.name === 'candidate' && review.candidate.id !== id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only delete the review that belongs to you.`,
          ),
        );

      const { title, description, key } = NotificationTypes.REVIEW_DELETED;

      this.rabbitMQNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: review.company.recruiters.map((r) => r.id),
      });

      await reviewRepository.delete({ id: reviewId });

      return { message: 'Review deleted successfully!' };
    });
  };

  public handleGetReview = async (reviewId: string, user: User) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);

      const { id, role } = user;

      const review = await reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['candidate', 'company', 'company.recruiters'],
        select: {
          id: true,
          ratings_number: true,
          comment: true,
          company: {
            name: true,
            bio: true,
            id: true,
            address: true,
            website: true,
          },
          candidate: {
            id: true,
            email: true,
            phone_number: true,
            full_name: true,
            bio: true,
          },
        },
      });

      if (role.name === 'candidate' && review?.candidate.id !== id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only get the review that belongs to you.`,
          ),
        );

      if (
        role.name === 'recruiter' &&
        !review?.company.recruiters.some((re) => re.id === id)
      )
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only get the review of the company that you belongs to.',
          ),
        );

      return review;
    });
  };
}
