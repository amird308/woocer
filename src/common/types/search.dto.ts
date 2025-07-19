import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'term must be a string' })
  @MinLength(1, { message: 'term must be at least 1 character' })
  @MaxLength(64, { message: 'term must be less than 64 characters' })
  term?: string;
}
