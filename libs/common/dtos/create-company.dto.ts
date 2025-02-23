import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsOptional()
  readonly bio?: string;

  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @IsOptional()
  readonly website?: string;
}
