import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class RemoveSavedJobsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(
    /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})(,([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}))*$/,
    {
      message: 'jobIds must be a comma-separated list of valid UUIDs',
    },
  )
  readonly jobIds!: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly candidate_id?: string;
}
