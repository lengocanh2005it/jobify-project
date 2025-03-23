import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating number between 1 and 5',
    example: 5,
    enum: [1, 2, 3, 4, 5],
  })
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3, 4, 5])
  readonly ratings_number!: number;

  @ApiProperty({
    description: 'Comment for the review',
    example: 'Excellent service!',
  })
  @IsString()
  @IsNotEmpty()
  readonly comment!: string;

  @ApiProperty({
    description: 'The ID of the company being reviewed',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly company_id!: string;
}
