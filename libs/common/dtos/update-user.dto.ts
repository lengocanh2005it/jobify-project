import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';
import { UpdateCompanyDto } from 'libs/common/dtos/update-company.dto';

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
  @IsNumber()
  @IsPositive()
  readonly expected_salary?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly skills?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly certifications?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly updateCompanyDto: string;
}
