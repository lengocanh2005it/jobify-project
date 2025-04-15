import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from 'apps/api-gateway/src/reviews/reviews.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateReviewDto,
  SearchReviewsDto,
  UpdateReviewDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
@ApiBearerAuth()
@ApiTags(API_TAGS.REVIEWS)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post()
  @Roles(Role.CANDIDATE)
  @RBAcPermissions('review@create')
  @ResponseMessage('New review created successfully!')
  @ApiOperation({
    summary: 'Create a new review',
    description: 'Create a new review with some given data.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        ratings_number: 2,
        comment: 'Bad Service',
        company: {
          name: 'FPT Software',
          bio: 'Some bio of FPT Software...',
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          address: 'Ha Noi',
          website: 'https://fpt.software.com.vn',
        },
        candidate: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          email: 'user123@gmail.com',
          phone_number: '+24523423423',
          full_name: 'John Doe',
          bio: 'Specialize in Backend Developer with 5 years experiences.',
        },
      },
    },
  })
  @ApiBody({
    type: CreateReviewDto,
    description: 'Some give data to be create a new review.',
  })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.reviewsService.handleCreateReview(createReviewDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER, Role.CANDIDATE)
  @RBAcPermissions('review@read')
  @ResponseMessage('Reviews fetched successfully!')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get reviews',
    description: 'Get all reviews about the companies in the system.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          ratings_number: 2,
          comment: 'Bad Service',
          company: {
            name: 'FPT Software',
            bio: 'Some bio of FPT Software...',
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            address: 'Ha Noi',
            website: 'https://fpt.software.com.vn',
          },
          candidate: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'user123@gmail.com',
            phone_number: '+24523423423',
            full_name: 'John Doe',
            bio: 'Specialize in Backend Developer with 5 years experiences.',
          },
        },
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          ratings_number: 2,
          comment: 'Bad Service',
          company: {
            name: 'FPT Software',
            bio: 'Some bio of FPT Software...',
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            address: 'Ha Noi',
            website: 'https://fpt.software.com.vn',
          },
          candidate: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'user123@gmail.com',
            phone_number: '+24523423423',
            full_name: 'John Doe',
            bio: 'Specialize in Backend Developer with 5 years experiences.',
          },
        },
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          ratings_number: 2,
          comment: 'Bad Service',
          company: {
            name: 'FPT Software',
            bio: 'Some bio of FPT Software...',
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            address: 'Ha Noi',
            website: 'https://fpt.software.com.vn',
          },
          candidate: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'user123@gmail.com',
            phone_number: '+24523423423',
            full_name: 'John Doe',
            bio: 'Specialize in Backend Developer with 5 years experiences.',
          },
        },
      ],
    },
  })
  async getReviews(
    @Req() request: Request,
    @Query() searchReviewsDto?: SearchReviewsDto,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleGetReviews(user, searchReviewsDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE)
  @RBAcPermissions('review@update')
  @ResponseMessage('Review updated successfully!')
  @ApiOperation({
    summary: 'Update review',
    description: 'Update an existing review by reviewId',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of review that want to update.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiBody({
    type: UpdateReviewDto,
    description: 'Some given data need to be update the review.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        ratings_number: 2,
        comment: 'Bad Service',
        company: {
          name: 'FPT Software',
          bio: 'Some bio of FPT Software...',
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          address: 'Ha Noi',
          website: 'https://fpt.software.com.vn',
        },
        candidate: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          email: 'user123@gmail.com',
          phone_number: '+24523423423',
          full_name: 'John Doe',
          bio: 'Specialize in Backend Developer with 5 years experiences.',
        },
      },
    },
  })
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
  @RBAcPermissions('review@delete')
  @ApiOperation({
    summary: 'Delete a review',
    description: 'Delete an existing review by review id.',
  })
  @ApiParam({
    name: 'id',
    description: 'The interview id',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: 'Review deleted successfully.',
    },
  })
  async deleteReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.reviewsService.handleDeleteReview(reviewId, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcPermissions('review:read')
  @ResponseMessage('Review fetched successfully!')
  @ApiOperation({
    summary: 'Get review',
    description: 'Get an existing review by review id.',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of review',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        ratings_number: 2,
        comment: 'Bad Service',
        company: {
          name: 'FPT Software',
          bio: 'Some bio of FPT Software...',
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          address: 'Ha Noi',
          website: 'https://fpt.software.com.vn',
        },
        candidate: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          email: 'user123@gmail.com',
          phone_number: '+24523423423',
          full_name: 'John Doe',
          bio: 'Specialize in Backend Developer with 5 years experiences.',
        },
      },
    },
  })
  async getReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const cacheKey = `reviews:${reviewId}`;

    const cachedReview = await this.cacheManager.get(cacheKey);

    if (cachedReview) return cachedReview;

    const review = await this.reviewsService.handleGetReview(reviewId, user);

    await this.cacheManager.set(cacheKey, review);

    return review;
  }
}
