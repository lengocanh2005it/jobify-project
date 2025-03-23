import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchApplicationsDto {
  @ApiProperty({
    name: 'status',
    description:
      'The status of applications to search for. Possible values: "pending", "approved", or "rejected".',
    example: 'pending',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  @IsNotEmpty()
  readonly status?: string;

  @ApiProperty({
    name: 'jobTitle',
    description: 'The title of the job associated with the applications.',
    example: 'Fullstack Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly jobTitle?: string;

  @ApiProperty({
    name: 'appliedAfter',
    description: 'Filter applications submitted after this date.',
    example: '2024-03-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly appliedAfter?: string;

  @ApiProperty({
    name: 'appliedBefore',
    description: 'Filter applications submitted before this date.',
    example: '2024-03-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly appliedBefore?: string;

  @ApiProperty({
    name: 'candidate_email',
    description: "Filter applications by the candidate's email address.",
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  readonly candidate_email?: string;

  @ApiProperty({
    name: 'candidate_name',
    description: "Filter applications by the candidate's full name.",
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly candidate_name?: string;
}
