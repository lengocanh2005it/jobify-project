import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    name: 'email',
    description: 'Email of user.',
    example: 'user123@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;
}
