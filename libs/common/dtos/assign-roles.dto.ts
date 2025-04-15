import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    type: [String],
    description: 'The userIds array need to be assign roles.',
    example: [
      '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
      '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  readonly userIds!: string[];
}
