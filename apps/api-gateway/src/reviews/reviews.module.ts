import { Module } from '@nestjs/common';
import { ReviewsController } from 'apps/api-gateway/src/reviews/reviews.controller';
import { ReviewsService } from 'apps/api-gateway/src/reviews/reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
