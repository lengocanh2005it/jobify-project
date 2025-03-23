import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchNotificationsDto {
  @ApiPropertyOptional({
    description: 'The title of the notification',
    example: 'System maintenance',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the notification has been read',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  readonly is_read?: true;

  @ApiPropertyOptional({
    description: 'The type of the notification (e.g., "system", "user")',
    example: 'system',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'The date before which the notification was created',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly createdBefore?: string;

  @ApiPropertyOptional({
    description: 'The date after which the notification was created',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly createdAfter?: string;
}
