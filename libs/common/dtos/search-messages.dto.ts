import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchMessagesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly from?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly to?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly attachment?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly keyword?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly sender_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly receiver_id?: string;
}
