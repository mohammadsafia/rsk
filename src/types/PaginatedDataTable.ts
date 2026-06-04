export type Pagination = {
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
};

export type PaginatedDataTable<T> = {
  data: T[];
  pagination: Pagination;
};
