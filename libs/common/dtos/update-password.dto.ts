import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    name: 'password',
    description: 'Current password of user.',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @ApiProperty({
    name: 'newPassword',
    description: 'New password of user',
    example: 'newPassword123',
  })
  @IsString()
  @IsNotEmpty()
  readonly newPassword!: string;

  @ApiProperty({
    name: 'otp',
    description: 'OTP has been used for updating password',
    example: '434563',
  })
  @IsString()
  @IsNotEmpty()
  readonly otp!: string;
}
