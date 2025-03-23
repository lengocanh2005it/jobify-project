import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RejectedJobs {
  @ApiProperty({
    description: 'The unique identifier of the job',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  readonly job_id!: string;

  @ApiProperty({
    description: 'The reason for rejecting the job',
    example: 'Job does not meet the criteria',
  })
  @IsString()
  @IsNotEmpty()
  readonly reason!: string;
}

export class ProcessJobsDto {
  @ApiPropertyOptional({
    description: 'A list of approved job IDs',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly approvedJobIds?: string[];

  @ApiPropertyOptional({
    description: 'A list of rejected jobs with reasons',
    type: [RejectedJobs],
    example: [
      {
        job_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Job does not meet the criteria',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RejectedJobs)
  @ArrayMinSize(1)
  readonly rejectedJobs?: RejectedJobs[];
}
