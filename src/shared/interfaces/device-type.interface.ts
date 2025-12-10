import { IDeviceType } from "./device.interface";
import {
  IPaginationRequest,
  IPaginationResponse,
} from "./pagination.interface";

export interface IDeviceTypeCreate {
  deviceTypeName: string;
  description?: string;
  status?: number;
}

export interface IDeviceTypeUpdate extends Partial<IDeviceTypeCreate> {
  id: string;
}

export interface IDeviceTypeListRequest extends IPaginationRequest {
  deviceTypeName?: string;
  status?: number;
}

export interface IDeviceTypeListResponse
  extends IPaginationResponse<IDeviceType> {
  data: IDeviceType[];
}
