import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @IsString()
  @IsIn(['full_time', 'part_time', 'remote'])
  readonly job_type!: string;

  @IsNumber()
  @IsPositive()
  readonly salary_min!: number;

  @IsNumber()
  @IsPositive()
  readonly salary_max!: number;

  @IsString()
  @IsNotEmpty()
  readonly description!: string;

  @IsString()
  @IsIn(['open', 'closed'])
  readonly status!: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly posted_at!: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly expired_at!: Date;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  readonly requirements!: string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly recruiter_id?: string;
}
