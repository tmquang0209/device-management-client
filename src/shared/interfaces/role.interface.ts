import {
  IPaginationRequest,
  IPaginationResponse,
} from "./pagination.interface";

export interface IPermission {
  id: string;
  key: string;
  endpoint: string;
  method: string;
  description?: string;
}
export interface IRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: IPermission[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoleCreate {
  code: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface IRoleUpdate extends IRoleCreate {
  id: string;
}

export interface IRoleListRequest extends IPaginationRequest {
  code?: string;
  name?: string;
  description?: string;
  permissions?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export type IRoleListResponse = IPaginationResponse<IRole>;
