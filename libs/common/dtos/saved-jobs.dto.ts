import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SavedJobsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  readonly jobIds!: string[];
}
