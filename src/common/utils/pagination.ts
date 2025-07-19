import { PaginationResponse } from '../types/pagination.response';

export function makePaginationList<Payload>({
  payload,
  total = 0,
  page = 0,
  take = 10,
}: {
  payload: Payload[];
  total?: number;
  page?: number;
  take?: number;
}): PaginationResponse<Payload> {
  const currentPage = page + 1;
  const totalPages = Math.ceil(total / take);

  return {
    data: payload,
    currentPage: currentPage,
    totalPages,
    take,
    offset: take * page,
    total,
    hasNextPage: totalPages > currentPage,
    hasPrevPage: currentPage > 1,
  };
}
