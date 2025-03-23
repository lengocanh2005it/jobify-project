import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    description: 'The title of the interview position',
    type: String,
    example: 'Fullstack Developer',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'The type of interview',
    enum: InterviewType,
    example: InterviewType.OFFLINE,
  })
  @IsOptional()
  @IsEnum(InterviewType)
  @IsNotEmpty()
  readonly interview_type?: InterviewType;

  @ApiPropertyOptional({
    description: 'The current status of the interview',
    enum: InterviewStatus,
    example: InterviewStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  readonly status?: InterviewStatus;

  @ApiPropertyOptional({
    description: 'The approval status of the interview',
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  readonly approval_status?: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'The final result of the interview',
    enum: InterviewResult,
    example: InterviewResult.PASSED,
  })
  @IsOptional()
  @IsEnum(InterviewResult)
  @IsNotEmpty()
  readonly result?: InterviewResult;

  @ApiPropertyOptional({
    description: 'The interview score (from 1 to 10)',
    type: Number,
    example: 8,
  })
  @IsOptional()
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  @IsNumber()
  @IsPositive()
  readonly score?: number;

  @ApiPropertyOptional({
    description: 'Filter interviews before a specific date (YYYY-MM-DD)',
    type: String,
    example: '2024-08-20',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interviewDateBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter interviews after a specific date (YYYY-MM-DD)',
    type: String,
    example: '2024-08-10',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interviewDateAfter?: string;
}
