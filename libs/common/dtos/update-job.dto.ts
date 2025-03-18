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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @IsOptional()
  @IsEnum(JobType)
  @IsNotEmpty()
  readonly job_type?: JobType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly salary_min?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly salary_max?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['open', 'closed'])
  readonly status?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly expired_at!: Date;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly requirements!: string[];

  @IsOptional()
  @IsEnum(JobCategory)
  @IsNotEmpty()
  readonly category?: JobCategory;
}
