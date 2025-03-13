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

export class RejectedInterviews {
  @IsString()
  @IsNotEmpty()
  readonly interviewId!: string;

  @IsString()
  @IsNotEmpty()
  readonly reason!: string;
}

export class CandidatesProcessInterviewsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly approvedInterviewIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RejectedInterviews)
  readonly rejectedInterviews?: RejectedInterviews[];
}
