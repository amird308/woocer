import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number (0-based)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  readonly page?: number = 0;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  readonly take?: number = 10;
}
