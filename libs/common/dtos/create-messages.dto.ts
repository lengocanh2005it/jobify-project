import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateMessagesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1)
  readonly content?: string;

  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  readonly replied_message_id?: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly receiver_id!: string;
}
