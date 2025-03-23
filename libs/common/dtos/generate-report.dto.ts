import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({
    enum: ['company_recruitment_overview'],
    description: 'Type of report to generate',
    example: 'company_recruitment_overview',
  })
  @IsIn(['company_recruitment_overview'])
  @IsNotEmpty()
  readonly reportType!: string;

  @ApiProperty({
    enum: ['pdf', 'csv'],
    description: 'Format of the report',
    example: 'pdf',
  })
  @IsIn(['pdf', 'csv'])
  @IsNotEmpty()
  readonly format!: string;
}
