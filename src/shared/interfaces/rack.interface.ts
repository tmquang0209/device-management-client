import {
  IPaginationRequest,
  IPaginationResponse,
} from "./pagination.interface";

export interface IRack {
  id: string;
  code: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface IRackCreate {
  code: string;
  status?: number;
}

export interface IRackUpdate extends Partial<IRackCreate> {
  id: string;
}

export interface IRackListRequest extends IPaginationRequest {
  code?: string;
  status?: number;
}

export interface IRackListResponse extends IPaginationResponse<IRack> {
  data: IRack[];
}
