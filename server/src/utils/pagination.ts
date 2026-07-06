export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const getPaginationOptions = (options: any): Required<PaginationOptions> => {
  return {
    page: options.page ? parseInt(options.page, 10) : 1,
    limit: options.limit ? parseInt(options.limit, 10) : 10,
    sortBy: options.sortBy || 'createdAt',
    order: options.order === 'asc' ? 'asc' : 'desc',
  };
};
