import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The email of the user',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the user',
    example: '+123456789',
  })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty()
  readonly phone_number?: string;

  @ApiPropertyOptional({
    description: 'The address of the user',
    example: '1234 Elm Street, Springfield',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @ApiPropertyOptional({
    description: 'User biography',
    example: 'Software developer with 5 years of experience',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly bio?: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly full_name?: string;

  @ApiPropertyOptional({
    description: 'The expected salary of the user',
    example: 50000,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsString()
  @IsNotEmpty()
  readonly expected_salary?: number;

  @ApiPropertyOptional({
    description: 'Skills of the user',
    example: 'JavaScript, Node.js, React',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly skills?: string;

  @ApiPropertyOptional({
    description: 'Certifications of the user',
    example: 'Certified JavaScript Developer',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly certifications?: string;

  @ApiPropertyOptional({
    description: 'Related company update information (if any)',
    example: 'Company XYZ',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly updateCompanyDto?: string;

  @ApiPropertyOptional({
    description: 'The unique user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly user_id?: string;
}
