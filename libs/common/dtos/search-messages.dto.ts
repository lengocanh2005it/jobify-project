import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchMessagesDto {
  @ApiPropertyOptional({
    description: 'The sender of the message',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly from?: string;

  @ApiPropertyOptional({
    description: 'The receiver of the message',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly to?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the message has an attachment',
    example: 'image.jpg',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly attachment?: string;

  @ApiPropertyOptional({
    description: 'Search for messages containing a specific keyword',
    example: 'meeting',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly keyword?: string;

  @ApiPropertyOptional({
    description: 'Sender ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly sender_id?: string;

  @ApiPropertyOptional({
    description: 'Receiver ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly receiver_id?: string;
}
