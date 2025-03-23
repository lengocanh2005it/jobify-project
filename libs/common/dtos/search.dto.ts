import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SearchDto {
  @ApiProperty({
    description: 'The type of the search query (e.g., "jobs")',
    example: 'jobs',
  })
  @IsIn(['jobs'])
  @IsNotEmpty()
  readonly type!: string;

  @ApiProperty({
    description: 'The query string to search for',
    example: 'developer',
  })
  @IsString()
  @IsNotEmpty()
  readonly query!: string;
}
