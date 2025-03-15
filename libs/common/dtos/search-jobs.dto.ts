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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @IsOptional()
  @IsEnum(['full_time', 'part_time', 'remote'])
  readonly job_type?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  readonly salary_min?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  readonly salary_max?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly postedAfter?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly postedBefore?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiredAfter?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiredBefore?: string;
}
