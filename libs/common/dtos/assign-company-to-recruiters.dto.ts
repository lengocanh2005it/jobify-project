import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class AssignCompanyToRecruitersDto {
  @ApiProperty({
    type: [String],
    description: 'List of recruiter IDs to assign to the company',
    example: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly recruiterIds!: string[];

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the company to assign recruiters to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly company_id!: string;
}
