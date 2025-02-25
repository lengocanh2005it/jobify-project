import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class RejectApplicationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly applicationIds: string[];
}
