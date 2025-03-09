import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @IsString()
  @IsNotEmpty()
  readonly phone_number!: string;

  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @IsOptional()
  readonly bio?: string;

  @IsString()
  @IsIn(['candidate', 'recruiter'])
  readonly type!: string;

  @IsString()
  @IsNotEmpty()
  readonly full_name!: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @IsPositive()
  readonly expected_salary!: number;

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
  readonly createCompanyDto?: string;
}
