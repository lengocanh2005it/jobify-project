export interface ReportStrategy {
  generate(data: any[], format: string): Promise<string> | string;
}
