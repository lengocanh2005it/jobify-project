import { IsIn, IsNotEmpty } from 'class-validator';

export class GenerateReportDto {
  @IsIn(['company_recruitment_overview'])
  @IsNotEmpty()
  readonly reportType!: string;

  @IsIn(['pdf', 'csv'])
  @IsNotEmpty()
  readonly format!: string;
}
