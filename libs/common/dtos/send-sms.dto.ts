import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    description: 'The recipient phone number.',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  readonly to!: string;

  @ApiProperty({
    description: 'The SMS message content.',
    example: 'Hello, this is a test message!',
  })
  @IsString()
  @IsNotEmpty()
  readonly message!: string;
}
