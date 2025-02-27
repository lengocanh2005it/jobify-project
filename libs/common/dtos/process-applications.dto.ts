import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class ProcessApplicationsDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  @IsNotEmpty()
  readonly status!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly applicationIds!: string[];
}
