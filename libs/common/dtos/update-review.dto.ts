import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Rating number between 1 and 5',
    example: 4,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ratings_number?: number;

  @ApiPropertyOptional({
    description: 'Comment for the review',
    example: 'Good service',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly comment?: string;
}
