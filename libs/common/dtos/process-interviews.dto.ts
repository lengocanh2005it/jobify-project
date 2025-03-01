import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class ProcessInterviewsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly approvedInterviewIds!: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly rejectedInterviewIds!: string[];
}
