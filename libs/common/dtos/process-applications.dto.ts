import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class ProcessApplicationsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly approvedApplicationIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly rejectedApplicationIds?: string[];
}
