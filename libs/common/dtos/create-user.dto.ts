import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsNotEmpty()
  readonly password!: string;

  @IsString()
  @IsNotEmpty()
  readonly phone_number!: string;

  @IsString()
  @IsNotEmpty()
  readonly address!: string;

  @IsOptional()
  readonly bio?: string;

  @IsString()
  @IsIn(['candidate', 'recruiter'])
  readonly type!: string;
}
