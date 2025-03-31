import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({
    name: 'otp',
    description: 'OTP has been used for updating password',
    example: '434563',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly otp?: string;
}
