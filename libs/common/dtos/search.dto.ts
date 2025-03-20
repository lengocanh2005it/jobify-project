import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SearchDto {
  @IsIn(['jobs'])
  @IsNotEmpty()
  readonly type!: string;

  @IsString()
  @IsNotEmpty()
  readonly query!: string;
}
