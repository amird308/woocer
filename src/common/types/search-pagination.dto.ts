import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPaginationDto extends PaginationDto {
  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'term must be a string' })
  @MinLength(1, { message: 'term must be at least 1 character' })
  @MaxLength(64, { message: 'term must be less than 64 characters' })
  term?: string;
}
