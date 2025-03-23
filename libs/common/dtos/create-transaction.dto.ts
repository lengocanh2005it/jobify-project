import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Amount for the transaction',
    example: 100.5,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  readonly amount!: number;
}
