import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the company',
    example: 'FPT Software',
  })
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiPropertyOptional({
    name: 'bio',
    description: 'Bio of the company',
    example: 'A company specialize in software.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly bio?: string;

  @ApiProperty({
    name: 'address',
    description: 'Address of the company',
    example: 'Ha Noi',
  })
  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @ApiPropertyOptional({
    name: 'website',
    description: 'Website url of the company',
    example: 'https://fpt.software.com.vn',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly website?: string;
}
