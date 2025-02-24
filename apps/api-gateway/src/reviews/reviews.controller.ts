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
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators';
import { CreateReviewDto } from 'libs/common/dtos/create-review.dto';
import { UpdateReviewDto } from 'libs/common/dtos/update-review.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as Record<string, string | number>)
      .userId as string;

    return this.reviewsService.handleCreateReview(createReviewDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  getReviews() {
    return this.reviewsService.handleGetReviews();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  updateReview(
    @Body() updateReviewDto: UpdateReviewDto,
    @Param(':id', ParseUUIDPipe) reviewId: string,
  ) {
    return this.reviewsService.handleUpdateReview(updateReviewDto, reviewId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  deleteReview(@Param(':id', ParseUUIDPipe) reviewId: string) {
    return this.reviewsService.handleDeleteReview(reviewId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getReview(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewsService.handleGetReview(reviewId);
  }
}
