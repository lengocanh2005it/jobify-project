import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyNewDeviceDto {
  @ApiProperty({
    name: 'otp',
    description: 'OTP has been used for verify new device.',
    example: '434563',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6)
  readonly otp!: string;
}
