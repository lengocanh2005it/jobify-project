import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Company } from 'apps/jobs/src/entities';
import { Review } from 'apps/reviews/src/entities';
import { User } from 'apps/users/src/entities';
import { ElasticIndexes, NotificationTypes } from 'libs/common/constants';
import {
  CreateReviewDto,
  SearchReviewsDto,
  UpdateReviewDto,
} from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMQNotificationClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const reviewRepository = queryRunner.manager.getRepository(Review);
      return this.handleSyncReviewsToElasticSearch(reviewRepository);
    });
  }

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

  public handleGetReviews = async (
    user: User,
    searchReviewsDto?: SearchReviewsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const { role, company, id } = user;

        const must: any[] = [];

        if (searchReviewsDto) {
          if (searchReviewsDto.ratings_number) {
            must.push({
              match: {
                ratings_number: searchReviewsDto.ratings_number,
              },
            });
          }

          if (searchReviewsDto.candidate_name) {
            if (role.name === 'candidate')
              throw new RpcException(
                generateRpcExceptionResponse(
                  HttpStatus.BAD_REQUEST,
                  `You can only get all reviews that belongs to you.`,
                ),
              );

            must.push({
              match: {
                'candidate.full_name': searchReviewsDto.candidate_name,
              },
            });
          }

          if (
            searchReviewsDto.reviewDateAfter ||
            searchReviewsDto.reviewDateBefore
          ) {
            const rangeFilter: any = { createdAt: {} };

            if (searchReviewsDto.reviewDateAfter) {
              rangeFilter.createdAt.gte = searchReviewsDto.reviewDateAfter;
            }

            if (searchReviewsDto.reviewDateBefore) {
              rangeFilter.createdAt.lte = searchReviewsDto.reviewDateBefore;
            }

            must.push({ range: rangeFilter });
          }
        }

        switch (role.name) {
          case 'recruiter':
            must.push({ match: { 'company.id': company.id } });
            break;
          case 'admin':
            break;
          default:
            must.push({ match: { 'candidate.id': id } });
            break;
        }

        const queryBody = {
          query: {
            bool: {
              must,
            },
          },
        };

        const { hits } = await this.elasticsearchService.search<Review>({
          index: ElasticIndexes.REVIEWS,
          body: queryBody,
        });

        return hits.hits.map((hit) => hit._source);
      } catch (err) {
        if (err?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error: ', err);
        throw err;
      }
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

      const updatedReview = (await reviewRepository.findOne({
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
      })) as Review;

      await this.elasticsearchService.index({
        index: ElasticIndexes.REVIEWS,
        id: reviewId,
        body: {
          id: updatedReview.id,
          ratings_number: updatedReview.ratings_number,
          comment: updatedReview.comment,
          createdAt: updatedReview.createdAt,
          company: {
            id: updatedReview.company.id,
            name: updatedReview.company.name,
            bio: updatedReview.company.bio,
            address: updatedReview.company.address,
            website: updatedReview.company.website,
          },
          candidate: {
            id: updatedReview.candidate.id,
            email: updatedReview.candidate.email,
            phone_number: updatedReview.candidate.phone_number,
            full_name: updatedReview.candidate.full_name,
            bio: updatedReview.candidate.bio,
          },
        },
      });

      return updatedReview;
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

      await this.elasticsearchService.delete({
        index: ElasticIndexes.REVIEWS,
        id: reviewId,
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

  private handleSyncReviewsToElasticSearch = async (
    reviewRepository: Repository<Review>,
  ) => {
    const reviews = await reviewRepository.find({
      relations: ['company', 'candidate'],
    });

    const bulkBody = reviews.flatMap((review) => [
      { index: { _index: ElasticIndexes.REVIEWS, _id: review.id } },
      {
        id: review.id,
        ratings_number: review.ratings_number,
        comment: review.comment,
        createdAt: review.createdAt,
        company: {
          id: review.company.id,
          name: review.company.name,
          bio: review.company.bio,
          address: review.company.address,
          website: review.company.website,
        },
        candidate: {
          id: review.candidate.id,
          email: review.candidate.email,
          phone_number: review.candidate.phone_number,
          full_name: review.candidate.full_name,
          bio: review.candidate.bio,
        },
      },
    ]);

    if (!bulkBody.length) {
      console.warn(
        '⚠️ Bulk request body is empty, skipping Elasticsearch sync.',
      );
      return;
    }

    await this.elasticsearchService.bulk({
      index: ElasticIndexes.REVIEWS,
      body: bulkBody,
    });
  };
}
