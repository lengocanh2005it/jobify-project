import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Company, Job])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
