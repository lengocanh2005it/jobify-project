import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @IsString()
  @IsNotEmpty()
  readonly newPassword!: string;

  @IsString()
  @IsNotEmpty()
  readonly otp!: string;
}
