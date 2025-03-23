import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    name: 'content',
    description: 'New content of the message.',
    example: 'Hello !',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  readonly content!: string;
}
