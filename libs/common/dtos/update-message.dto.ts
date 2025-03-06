import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  readonly content!: string;
}
