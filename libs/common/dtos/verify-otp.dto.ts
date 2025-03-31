import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The OTP code sent to the user.',
    example: '123456',
  })
  @Length(6, 6, { message: 'Otp length mus be at equal to 6 characters.' })
  readonly otp!: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    name: 'email',
    description: 'Email of user.',
    example: 'user123@gmail.com',
  })
  readonly email!: string;
}
