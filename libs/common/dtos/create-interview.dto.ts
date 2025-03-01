import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InterviewType } from 'libs/common/constants';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_link?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_address?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly interview_date!: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly note?: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly job_id!: string;

  @IsEnum(InterviewType)
  readonly interview_type!: InterviewType;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  readonly candidate_id!: string;
}
