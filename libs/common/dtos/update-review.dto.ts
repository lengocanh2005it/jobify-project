import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ratings_number?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly comment?: string;
}
