import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SearchReviewsDto {
  @ApiPropertyOptional({
    description: 'The name of the candidate to search for',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly candidate_name?: string;

  @ApiPropertyOptional({
    description: 'The rating number (1 to 5)',
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5])
  readonly ratings_number?: number;

  @ApiPropertyOptional({
    description: 'The date before which the review was made',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly reviewDateBefore?: string;

  @ApiPropertyOptional({
    description: 'The date after which the review was made',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly reviewDateAfter?: string;
}
