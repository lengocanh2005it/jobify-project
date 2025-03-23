import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateMessagesDto {
  @ApiPropertyOptional({
    type: String,
    description: 'The content of the message',
    example: 'Hello, how are you?',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1)
  readonly content?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'ID of the message being replied to (if any)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  readonly replied_message_id?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the message receiver',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly receiver_id!: string;
}
