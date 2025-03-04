import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchNotificationsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  readonly is_read?: true;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly type?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly createdBefore?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly createdAfter?: string;
}
