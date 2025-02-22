import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsNotEmpty()
  readonly password!: string;
}
