import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateCompanyDto } from 'libs/common/dtos/create-company.dto';

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
  readonly expected_salary!: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly skills?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly createCompanyDto?: string;
}
