import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({
    name: 'email',
    description: 'Email of user.',
    example: 'john01@gmail.com',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  readonly email!: string;
}
