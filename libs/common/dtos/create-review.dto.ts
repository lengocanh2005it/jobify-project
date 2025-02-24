import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5])
  readonly ratings_number!: number;

  @IsString()
  @IsNotEmpty()
  readonly comment!: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly company_id!: string;
}
