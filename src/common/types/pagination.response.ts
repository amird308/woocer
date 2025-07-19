import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse<Payload> {
  data: Array<Payload>;

  @ApiProperty({ type: Number })
  currentPage: number;

  @ApiProperty({ type: Number })
  totalPages: number;

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  take: number;

  @ApiProperty({ type: Number })
  offset: number;

  @ApiProperty({ type: Boolean })
  hasNextPage: boolean;

  @ApiProperty({ type: Boolean })
  hasPrevPage: boolean;
}
