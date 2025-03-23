import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class DeleteJobDto {
  @ApiPropertyOptional({
    name: 'recruiter_id',
    example: '17118ca1-a8a7-4fd3-9d3d-08f23cf1cf55',
    description: 'The recruiter id',
  })
  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  readonly recruiter_id?: string;
}
