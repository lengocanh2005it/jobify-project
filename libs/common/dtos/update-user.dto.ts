import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly phone_number?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly bio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly full_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly expected_salary?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly skills?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly certifications?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly updateCompanyDto: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly user_id?: string;
}
