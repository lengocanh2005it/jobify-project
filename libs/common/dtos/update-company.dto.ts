import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'The name of the company (optional)',
    example: 'TechCorp Inc.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'A brief bio of the company (optional)',
    example: 'A leading tech company specializing in AI solutions.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly bio?: string;

  @ApiPropertyOptional({
    description: "The company's address (optional)",
    example: '123 Tech Avenue, Silicon Valley, CA',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly address?: string;

  @ApiPropertyOptional({
    description: "The company's website URL (optional)",
    example: 'https://techcorp.com',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly website?: string;
}
