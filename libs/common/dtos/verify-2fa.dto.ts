import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FaDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP length must be equal to 6 characters.' })
  @ApiProperty({
    description: 'The OTP code sent to the user.',
    example: '123456',
  })
  readonly otp!: string;

  @ApiProperty({
    description: 'Specify whether to enable or disable 2FA.',
    enum: ['enable', 'disable'],
    example: 'enable',
  })
  @IsIn(['enable', 'disable'])
  @IsNotEmpty()
  readonly type!: 'enable' | 'disable';
}
