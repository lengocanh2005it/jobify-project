import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { JobCategory, JobType } from 'libs/common/constants';

export class CreateJobDto {
  @ApiProperty({
    name: 'title',
    description: 'The title of job.',
    example: 'Software Engineer Intern',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @ApiProperty({
    name: 'address',
    description: 'The address of job.',
    type: String,
    example: '123 Main Street, Dong Da Strict, Ha Noi',
  })
  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @ApiProperty({
    name: 'job_type',
    description: 'The job type of job.',
    enum: JobType,
    example: 'part_time',
  })
  @IsEnum(JobType)
  @IsNotEmpty()
  readonly job_type!: JobType;

  @ApiProperty({
    name: 'salary_min',
    type: Number,
    description: 'The min salary of job.',
    example: 1200,
  })
  @IsNumber()
  @IsPositive()
  readonly salary_min!: number;

  @ApiProperty({
    name: 'salary_max',
    description: 'The max salary of job.',
    example: 2000,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  readonly salary_max!: number;

  @ApiProperty({
    name: 'description',
    description: 'The description of job.',
    type: String,
    example:
      'This job has been suitable for Software Engineer Developer Intern.',
  })
  @IsString()
  @IsNotEmpty()
  readonly description!: string;

  @ApiProperty({
    name: 'status',
    description: 'The status of job.',
    enum: ['open', 'closed'],
    example: 'open',
  })
  @IsString()
  @IsIn(['open', 'closed'])
  readonly status!: string;

  @ApiProperty({
    name: 'posted_at',
    description: 'The posted date of job.',
    type: Date,
    example: '2025-03-20T12:56:56Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly posted_at!: Date;

  @ApiProperty({
    name: 'expired_at',
    description: 'The expired date of job.',
    type: Date,
    example: '2025-03-20T12:34:56Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly expired_at!: Date;

  @ApiProperty({
    name: 'requirements',
    description: 'A list of job requirements',
    type: [String],
    example: [
      'Familiarity with Docker and containerized applications',
      'Proficiency in React.js, Vue.js, or Angular',
      'Strong understanding of state management (Redux, Zustand, or Vuex)',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  readonly requirements!: string[];

  @ApiPropertyOptional({
    name: 'recruiter_id',
    type: String,
    description: 'The recruiter id of this new job if admin create job.',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly recruiter_id?: string;

  @ApiProperty({
    name: 'category',
    description: 'The category of job.',
    enum: JobCategory,
    example: JobCategory.BACKEND,
  })
  @IsEnum(JobCategory)
  @IsNotEmpty()
  readonly category!: JobCategory;
}
