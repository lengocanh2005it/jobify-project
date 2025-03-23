import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    description: 'The title of the interview (optional)',
    example: 'Software Engineer Interview',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'A brief description of the interview (optional)',
    example: 'Interview for the position of Software Engineer.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'The type of the interview (optional)',
    enum: InterviewType,
    example: InterviewType.OFFLINE,
  })
  @IsOptional()
  @IsEnum(InterviewType)
  readonly interview_type?: InterviewType;

  @ApiPropertyOptional({
    description: 'The link to the interview (optional)',
    example: 'https://zoom.us/meeting/123456789',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_link?: string;

  @ApiPropertyOptional({
    description: 'The address of the interview (optional)',
    example: '123 Tech Street, Suite 100, San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_address?: string;

  @ApiPropertyOptional({
    description: 'The reason for interview cancellation (optional)',
    example: 'Candidate is unavailable for the scheduled date.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly cancel_reason?: string;

  @ApiPropertyOptional({
    description: 'The date of the interview (optional)',
    example: '2025-04-15T09:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly interview_date?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes for the interview (optional)',
    example: 'Candidate seems well-prepared.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly note?: string;

  @ApiPropertyOptional({
    description: 'The status of the interview (optional)',
    enum: InterviewStatus,
    example: InterviewStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  readonly status?: InterviewStatus;

  @ApiPropertyOptional({
    description: 'The score given to the interview (optional)',
    example: 8,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  readonly score?: number;

  @ApiPropertyOptional({
    description: 'Additional notes on the result of the interview (optional)',
    example: 'The candidate performed exceptionally well.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly result_note?: string;

  @ApiPropertyOptional({
    description: 'The result of the interview (optional)',
    enum: InterviewResult,
    example: InterviewResult.PASSED,
  })
  @IsOptional()
  @IsEnum(InterviewResult)
  @IsNotEmpty()
  readonly result?: InterviewResult;
}
