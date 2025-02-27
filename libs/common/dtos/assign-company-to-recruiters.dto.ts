import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class AssignCompanyToRecruitersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly recruiterIds!: string[];

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly company_id!: string;
}
