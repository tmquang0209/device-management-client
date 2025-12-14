import { IDeviceLocationInfo } from "./device-location.interface";
import {
  IPaginationRequest,
  IPaginationResponse,
} from "./pagination.interface";

export interface IRack {
  id: string;
  code: string;
  count?: number;
  rows: number;
  cols: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deviceLocations?: IDeviceLocationInfo[];
}

export interface IRackCreate {
  code?: string;
  rows: number;
  cols: number;
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
