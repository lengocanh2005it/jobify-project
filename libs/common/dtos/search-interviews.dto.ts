import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import {
  ApprovalStatus,
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from 'libs/common/constants';

export class SearchInterviewsDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsEnum(InterviewType)
  @IsNotEmpty()
  readonly interview_type?: InterviewType;

  @IsOptional()
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  readonly status?: InterviewStatus;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  readonly approval_status?: ApprovalStatus;

  @IsOptional()
  @IsEnum(InterviewResult)
  @IsNotEmpty()
  readonly result?: InterviewResult;

  @IsOptional()
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  @IsNumber()
  @IsPositive()
  readonly score?: number;
}
