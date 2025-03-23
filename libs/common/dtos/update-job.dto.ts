import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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
} from 'class-validator';
import { JobCategory, JobType } from 'libs/common/constants';

export class UpdateJobDto {
  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @ApiPropertyOptional({ description: 'Job address' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @ApiPropertyOptional({
    enum: JobType,
    description: 'Job type (e.g., full-time, part-time)',
  })
  @IsOptional()
  @IsEnum(JobType)
  @IsNotEmpty()
  readonly job_type?: JobType;

  @ApiPropertyOptional({ description: 'Minimum salary', example: 500 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum salary', example: 1500 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly salary_max?: number;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @ApiPropertyOptional({ enum: ['open', 'closed'], description: 'Job status' })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'closed'])
  readonly status?: string;

  @ApiPropertyOptional({
    description: 'Job expiration date',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly expired_at!: Date;

  @ApiPropertyOptional({
    description: 'Job requirements',
    type: [String],
    example: ['Experience in JavaScript', 'Good communication skills'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly requirements!: string[];

  @ApiPropertyOptional({ enum: JobCategory, description: 'Job category' })
  @IsOptional()
  @IsEnum(JobCategory)
  @IsNotEmpty()
  readonly category?: JobCategory;
}
