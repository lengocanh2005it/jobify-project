import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SavedJobsDto {
  @ApiProperty({
    name: 'jobIds',
    type: [String],
    description: 'The job ids',
    example: [
      '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
      '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
      '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  readonly jobIds!: string[];
}
