import { Type } from 'class-transformer';
import {
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
  readonly approvedInterviewIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RejectedInterviews)
  readonly rejectedInterviews?: RejectedInterviews[];
}
