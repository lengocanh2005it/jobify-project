import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ratings_number?: number;

  @IsOptional()
  readonly comment?: string;
}
