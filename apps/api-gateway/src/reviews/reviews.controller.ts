import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from 'apps/api-gateway/src/reviews/reviews.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateReviewDto,
  SearchReviewsDto,
  UpdateReviewDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @ResponseMessage('New review created successfully!')
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.reviewsService.handleCreateReview(createReviewDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @ResponseMessage('Reviews fetched successfully!')
  async getReviews(
    @Req() request: Request,
    @Query() searchReviewsDto?: SearchReviewsDto,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleGetReviews(user, searchReviewsDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @ResponseMessage('Review updated successfully!')
  async updateReview(
    @Body() updateReviewDto: UpdateReviewDto,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleUpdateReview(
      updateReviewDto,
      reviewId,
      user,
    );
  }

  @Delete(':id')
  @ResponseMessage('Review deleted successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  async deleteReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleDeleteReview(reviewId, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Review fetched successfully!')
  async getReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleGetReview(reviewId, user);
  }
}
