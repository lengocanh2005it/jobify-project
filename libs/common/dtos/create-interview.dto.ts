import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
} from 'class-validator';
import { InterviewType } from 'libs/common/constants';

export class CreateInterviewDto {
  @ApiProperty({
    description: 'The title of the interview',
    type: String,
    example: 'Fullstack Developer Interview',
  })
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @ApiPropertyOptional({
    description: 'A brief description of the interview',
    type: String,
    example: 'Technical interview for the Fullstack Developer position.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'The online interview link',
    type: String,
    example: 'https://meet.google.com/xyz-1234',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_link?: string;

  @ApiPropertyOptional({
    description: 'The physical address where the interview will take place',
    type: String,
    example: '123 Main Street, New York, NY 10001',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly interview_address?: string;

  @ApiProperty({
    description: 'The scheduled date of the interview (ISO 8601 format)',
    type: String,
    example: '2024-09-15T14:30:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly interview_date!: Date;

  @ApiPropertyOptional({
    description: 'Additional notes regarding the interview',
    type: String,
    example: 'Candidate requested a reschedule.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly note?: string;

  @ApiProperty({
    description: 'The job ID associated with the interview',
    type: String,
    example: 'b13f8e47-9e5c-4c56-b4de-8f25f1d8e6f4',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly job_id!: string;

  @ApiProperty({
    description: 'The type of interview',
    enum: InterviewType,
    example: InterviewType.OFFLINE,
  })
  @IsEnum(InterviewType)
  readonly interview_type!: InterviewType;

  @ApiProperty({
    description: 'The candidate ID associated with the interview',
    type: String,
    example: '3d12f671-58e3-4d82-98c9-07e6d3a85c6a',
  })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  readonly candidate_id!: string;

  @ApiPropertyOptional({
    description: 'The recruiter ID associated with the interview (optional)',
    type: String,
    example: 'f98a1c5b-7d3e-4c09-97ab-182fbc86eb09',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly recruiter_id?: string;
}
