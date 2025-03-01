import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import {
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from 'libs/common/constants';

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @IsOptional()
  @IsEnum(InterviewType)
  readonly interview_type?: InterviewType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_link?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_address?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly cancel_reason?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly interview_date?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly note?: string;

  @IsOptional()
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  readonly status?: InterviewStatus;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  readonly score?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly result_note?: string;

  @IsOptional()
  @IsEnum(InterviewResult)
  @IsNotEmpty()
  readonly result?: InterviewResult;
}
