import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchTransactionsDto {
  @IsOptional()
  @IsIn(['PENDING', 'SUCCESS', 'FAILED'])
  @IsNotEmpty()
  readonly status?: 'PENDING' | 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly paymentDateAfter?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly paymentDateBefore?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiryDateAfter?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expiryDateBefore?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly user_fullName?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly user_email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly user_phoneNumber?: string;
}
