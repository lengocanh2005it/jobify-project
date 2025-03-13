import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  readonly content!: string;
}
