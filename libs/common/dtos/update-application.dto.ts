import { IsOptional } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  readonly resume_link?: string;

  @IsOptional()
  readonly cover_letter_link?: string;
}
