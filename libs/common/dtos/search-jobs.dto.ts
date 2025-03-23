import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SearchJobsDto {
  @ApiPropertyOptional({
    description: 'Filter by job title',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'Filter by job address/location',
    example: 'New York',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @ApiPropertyOptional({
    description: 'Filter by job type',
    enum: ['full_time', 'part_time', 'remote'],
    example: 'remote',
  })
  @IsOptional()
  @IsEnum(['full_time', 'part_time', 'remote'])
  readonly job_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum salary',
    example: 50000,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  readonly salary_min?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum salary',
    example: 100000,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  readonly salary_max?: number;

  @ApiPropertyOptional({
    description: 'Filter jobs posted after this date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly postedAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter jobs posted before this date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly postedBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter jobs expiring after this date',
    example: '2024-06-01',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiredAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter jobs expiring before this date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiredBefore?: string;
}
