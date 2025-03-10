import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities';
import { Review } from 'apps/reviews/src/entities';
import { User } from 'apps/users/src/entities';
import { NotificationTypes } from 'libs/common/constants';
import { CreateReviewDto, UpdateReviewDto } from 'libs/common/dtos';
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
    const { company_id: companyId, comment, ratings_number } = createReviewDto;

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
  };

  public handleGetReviews = async (user: User) => {
    const { role, company } = user;

    return await this.reviewRepository.find({
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
  };

  public handleUpdateReview = async (
    updateReviewDto: UpdateReviewDto,
    reviewId: string,
    user: User,
  ) => {
    const { role, id } = user;

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['candidate'],
    });

    if (!review)
      throw new RpcException(`Review With ID: '${reviewId}' Not Found.`);

    if (role.name === 'candidate' && review.candidate.id !== id)
      throw new RpcException(
        `You can only update the review that belongs to you.`,
      );

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
  };

  public handleDeleteReview = async (reviewId: string, user: User) => {
    const { id, role } = user;

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['company', 'company.recruiters'],
    });

    if (!review)
      throw new RpcException(`Review with id: '${reviewId}' not found.`);

    if (role.name === 'candidate' && review.candidate.id !== id)
      throw new RpcException(
        `You can only delete the review that belongs to you.`,
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

    await this.reviewRepository.delete({ id: reviewId });

    return { message: 'Review deleted successfully!' };
  };

  public handleGetReview = async (reviewId: string, user: User) => {
    const { id, role } = user;

    const review = await this.reviewRepository.findOne({
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
        `You can only get the review that belongs to you.`,
      );

    if (
      role.name === 'recruiter' &&
      !review?.company.recruiters.some((re) => re.id === id)
    )
      throw new RpcException(
        'You can only get the review of the company that you belongs to.',
      );

    return review;
  };
}
