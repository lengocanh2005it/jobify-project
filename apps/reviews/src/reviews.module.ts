import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from 'apps/reviews/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Review])],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Reviews Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class ReviewsModule {}
