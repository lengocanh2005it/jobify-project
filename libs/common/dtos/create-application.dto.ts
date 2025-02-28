import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  readonly job_id!: string;
}
