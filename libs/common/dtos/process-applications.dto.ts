import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProcessApplicationsDto {
  @ApiProperty({
    description: 'List of application IDs that are approved',
    example: ['0969eecd-0920-49b8-8c6d-f2ae22cabb1c'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly approvedApplicationIds?: string[];

  @ApiProperty({
    description: 'List of application IDs that are rejected',
    example: ['4b85d1ff-b02c-478e-8e9d-97c615f3a999'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly rejectedApplicationIds?: string[];
}
