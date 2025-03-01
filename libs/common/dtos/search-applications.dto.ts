import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchApplicationsDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  @IsNotEmpty()
  readonly status?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  readonly jobTitle?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly appliedAfter?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly appliedBefore?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly candidate_email?: string;
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly candidate_name?: string;
}
