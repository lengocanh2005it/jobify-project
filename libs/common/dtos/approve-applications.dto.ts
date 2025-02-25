import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ApproveApplicationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly applicationIds!: string[];
}
