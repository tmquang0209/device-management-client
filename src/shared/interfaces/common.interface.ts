export interface IResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface IErrorResponse {
  status: number;
  message: string[];
}

export interface IGenericResponse {
  status: number;
  message: string;
}

export interface IPaginatedResponse<T> {
  status: number;
  message: string;
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}