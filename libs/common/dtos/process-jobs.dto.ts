import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RejectedJobs {
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  readonly job_id!: string;

  @IsString()
  @IsNotEmpty()
  readonly reason!: string;
}

export class ProcessJobsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly approvedJobIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RejectedJobs)
  readonly rejectedJobs?: RejectedJobs[];
}
