export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Pagination query parser
 * Extracts and sanitizes page and limit parameters
 */
export const getPaginationParams = (query: Record<string, unknown> = {}, defaultLimit = 20, maxLimit = 100): PaginationParams => {
  let page = parseInt(String(query.page), 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(String(query.limit), 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds standard pagination response metadata
 */
export const getPaginationMetadata = (total: number, page: number, limit: number): PaginationMetadata => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default {
  getPaginationParams,
  getPaginationMetadata,
};
