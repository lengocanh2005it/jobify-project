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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly candidate_name?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5])
  readonly ratings_number?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly reviewDateBefore?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly reviewDateAfter?: string;
}
