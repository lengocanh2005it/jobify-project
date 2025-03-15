import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class DeleteJobDto {
  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  readonly recruiter_id?: string;
}
