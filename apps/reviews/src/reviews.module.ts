import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from 'apps/reviews/src/entities/reviews.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Review])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
