import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from 'apps/interviews/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Interview]), CommonModule],
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Interviews Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class InterviewsModule {}
