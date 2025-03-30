import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class Login2FaDto {
  @ApiProperty({
    description: 'The OTP code sent to the user.',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP length must be equal to 6 characters.' })
  readonly otp!: string;

  @ApiProperty({
    description: 'User email address.',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;
}
