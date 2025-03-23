import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProcessInterviewsDto {
  @ApiPropertyOptional({
    description: 'A list of interview IDs that the admin has approved',
    type: [String],
    example: [
      'a1234567-b89c-4d56-e012-3456789abcd',
      'f9876543-21ab-43cd-89ef-0123456789gh',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly approvedInterviewIds?: string[];

  @ApiPropertyOptional({
    description: 'A list of interview IDs that the admin has rejected',
    type: [String],
    example: [
      'x5678901-234b-45cd-6789-abcdef123456',
      'y7654321-9abc-48de-0123-abcdef987654',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  readonly rejectedInterviewIds?: string[];
}
