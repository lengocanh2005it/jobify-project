import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  readonly resume_link!: string;

  @IsOptional()
  readonly cover_letter_link?: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly job_id!: string;
}
