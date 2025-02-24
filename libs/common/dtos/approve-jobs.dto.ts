import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ApproveJobsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly jobIds!: string[];
}
