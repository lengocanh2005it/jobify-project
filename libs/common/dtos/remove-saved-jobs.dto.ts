import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class RemoveSavedJobsDto {
  @ApiProperty({
    name: 'jobIds',
    type: String,
    description: 'The jobIds that write in string',
    example:
      '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55,17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55,17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
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

  @ApiPropertyOptional({
    name: 'candidate_id',
    description: 'The candidate id',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  readonly candidate_id?: string;
}
