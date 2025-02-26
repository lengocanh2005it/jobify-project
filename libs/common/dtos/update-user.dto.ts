import { IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  readonly email?: string;

  @IsOptional()
  readonly phone_number?: string;

  @IsOptional()
  readonly address?: string;

  @IsOptional()
  readonly bio?: string;

  @IsOptional()
  readonly full_name?: string;

  @IsOptional()
  readonly avatar_url?: string;

  @IsOptional()
  readonly expected_salary?: number;
}
