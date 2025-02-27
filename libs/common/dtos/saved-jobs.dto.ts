import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class SavedJobsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly jobIds!: string[];
}
