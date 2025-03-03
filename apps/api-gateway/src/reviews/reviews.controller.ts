import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from 'apps/api-gateway/src/reviews/reviews.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.CANDIDATE)
  @ResponseMessage('New review created successfully!')
  createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.reviewsService.handleCreateReview(createReviewDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Reviews fetched successfully!')
  getReviews(@Req() request: Request) {
    const user = request.user as User;

    return this.reviewsService.handleGetReviews(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @ResponseMessage('Review updated successfully!')
  updateReview(
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Review deleted successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  deleteReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleDeleteReview(reviewId, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Review fetched successfully!')
  getReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleGetReview(reviewId, user);
  }
}
