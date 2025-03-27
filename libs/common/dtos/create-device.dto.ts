import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  readonly fingerprint!: string;

  @IsString()
  @IsNotEmpty()
  readonly ipAddress!: string;

  @IsString()
  @IsNotEmpty()
  readonly userAgent!: string;

  @IsDate()
  readonly lastLogin!: Date;

  @IsBoolean()
  readonly is_trusted!: boolean;

  @IsOptional()
  @IsPhoneNumber()
  readonly phone_number?: string;

  @IsString()
  @IsNotEmpty()
  readonly device_type!: string;
}
