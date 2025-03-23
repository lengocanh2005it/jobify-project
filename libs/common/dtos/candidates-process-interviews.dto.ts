import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectedInterviews {
  @ApiProperty({
    description: 'The ID of the interview being rejected',
    example: 'a123b456-c789-d012-e345-f678901gh234',
  })
  @IsString()
  @IsNotEmpty()
  readonly interviewId!: string;

  @ApiProperty({
    description: 'The reason for rejecting the interview',
    example: 'Schedule conflict with another interview',
  })
  @IsString()
  @IsNotEmpty()
  readonly reason!: string;
}

export class CandidatesProcessInterviewsDto {
  @ApiPropertyOptional({
    description: 'List of interview IDs that the candidate has approved',
    example: [
      'a123b456-c789-d012-e345-f678901gh234',
      'b234c567-d890-e123-f456-g789012hi345',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly approvedInterviewIds?: string[];

  @ApiPropertyOptional({
    description: 'List of rejected interviews along with reasons',
    type: [RejectedInterviews],
    example: [
      {
        interviewId: 'c345d678-e901-f234-g567-h890123ij456',
        reason: 'Already accepted another offer',
      },
      {
        interviewId: 'd456e789-f012-g345-h678-i901234jk567',
        reason: 'Personal reasons',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RejectedInterviews)
  readonly rejectedInterviews?: RejectedInterviews[];
}
