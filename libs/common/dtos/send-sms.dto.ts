import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SendSmsDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  readonly to!: string;

  @IsString()
  @IsNotEmpty()
  readonly message!: string;
}
