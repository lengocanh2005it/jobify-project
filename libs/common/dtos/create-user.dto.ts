import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
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

  @IsPhoneNumber()
  @IsNotEmpty()
  readonly phone_number!: string;

  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @IsOptional()
  @IsString()
  readonly bio?: string;

  @IsString()
  @IsIn(['candidate', 'recruiter'])
  readonly type!: string;

  @IsString()
  @IsNotEmpty()
  readonly full_name!: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== null && value !== undefined ? parseFloat(value as string) : value,
  )
  @IsNumber()
  @IsPositive()
  readonly expected_salary?: number;

  @ApiPropertyOptional({ type: [String], example: ['Java', 'React'] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  readonly skills?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  readonly certifications?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object')
      return plainToInstance(CreateCompanyDto, value);
    try {
      return plainToInstance(CreateCompanyDto, JSON.parse(value as string));
    } catch {
      throw new Error('Invalid JSON format for createCompanyDto');
    }
  })
  readonly createCompanyDto?: CreateCompanyDto;
}
