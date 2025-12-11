import { IPaginationRequest } from "@/shared/interfaces";

export interface IParamInfo {
  id: string;
  type: string;
  code: string;
  value: string;
  status: number | boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IParamCreate {
  type: string;
  code: string;
  value: string;
  status?: number | boolean;
}

export interface IParamUpdate extends Partial<IParamCreate> {
  id: string;
}

export interface IParamListRequest extends IPaginationRequest {
  type?: string;
  code?: string;
  status?: number | boolean;
}
