import { IsEmail, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email!: string;
}
