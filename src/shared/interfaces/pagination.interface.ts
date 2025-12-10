export interface IPaginationRequest {
  page?: number;
  pageSize?: number;
}

export interface IPaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
