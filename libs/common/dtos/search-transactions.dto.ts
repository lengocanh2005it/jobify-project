import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchTransactionsDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    description: 'Filter transactions by status',
    example: 'PENDING',
  })
  @IsOptional()
  @IsIn(['PENDING', 'SUCCESS', 'FAILED'])
  @IsNotEmpty()
  readonly status?: 'PENDING' | 'SUCCESS' | 'FAILED';

  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01',
    description: 'Filter transactions with a payment date after this value',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly paymentDateAfter?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-12-31',
    description: 'Filter transactions with a payment date before this value',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly paymentDateBefore?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-06-30',
    description: 'Filter transactions with an expiry date after this value',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiryDateAfter?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2024-12-31',
    description: 'Filter transactions with an expiry date before this value',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiryDateBefore?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'John Doe',
    description: 'Filter transactions by user full name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly user_fullName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'user@example.com',
    description: 'Filter transactions by user email',
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly user_email?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+1234567890',
    description: 'Filter transactions by user phone number',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly user_phoneNumber?: string;
}
