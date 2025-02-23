import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
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
}
