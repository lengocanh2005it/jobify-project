import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Review } from 'apps/reviews/src/entities/reviews.entity';
import { NotificationTypes } from 'libs/common/constants';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMQNotificationClient: ClientProxy,
  ) {}

  public handleCreateReview = async (
    createReviewDto: CreateReviewDto,
    userId: string,
  ) => {
    try {
      const {
        company_id: companyId,
        comment,
        ratings_number,
      } = createReviewDto;

      const company = await lastValueFrom<Company | undefined>(
        this.rabbitMqJobClient.send({ cmd: 'get-company' }, companyId),
      );

      if (!company)
        throw new RpcException(`Company With ID: '${companyId}' Not Found.`);

      let newReview = await this.reviewRepository.findOne({
        where: {
          candidate: { id: userId },
          comment,
          ratings_number,
        },
        relations: ['candidate'],
      });

      if (newReview)
        throw new RpcException(
          `You have already reviewed this company and cannot submit another review.`,
        );

      newReview = this.reviewRepository.create({ comment, ratings_number });

      await this.reviewRepository.save(newReview);

      await this.dataSource
        .createQueryBuilder()
        .relation(Review, 'candidate')
        .of(newReview.id)
        .set(userId);

      await this.dataSource
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

      return await this.reviewRepository.findOne({
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
    } catch (err) {
      console.error('Error from reviews service: ', err);
      throw err;
    }
  };

  public handleGetReviews = async () => {
    try {
      return await this.reviewRepository.find({
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
    } catch (err) {
      console.error(err);
    }
  };

  public handleUpdateReview = async (
    updateReviewDto: UpdateReviewDto,
    reviewId: string,
  ) => {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
      });

      if (!review)
        throw new RpcException(`Review With ID: '${reviewId}' Not Found.`);

      await this.reviewRepository.update({ id: reviewId }, updateReviewDto);

      return await this.reviewRepository.findOne({
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
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleDeleteReview = async (reviewId: string) => {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['company', 'company.recruiters'],
      });

      if (!review)
        throw new RpcException(`Review With ID: '${reviewId}' Not Found.`);

      const { title, description, key } = NotificationTypes.REVIEW_DELETED;

      this.rabbitMQNotificationClient.emit('create-notification', {
        data: {
          title,
          message: description,
          type: key,
        },
        userIds: review.company.recruiters.map((r) => r.id),
      });

      await this.reviewRepository.delete({ id: reviewId });

      return { message: 'Review deleted successfully!' };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleGetReview = async (reviewId: string) => {
    try {
      const review = await this.reviewRepository.findOne({
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

      return review;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
