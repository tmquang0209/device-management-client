import {
  IPaginationRequest,
  IPaginationResponse,
} from "./pagination.interface";

export interface IDeviceLocationInfo {
  id: string;
  xPosition?: string;
  yPosition?: string;
  status: number;
}

export interface IDeviceLocation {
  id: string;
  rackId: string;
  xPosition?: string;
  yPosition?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  rack?: {
    id: string;
    code: string;
  };
}

export interface IDeviceLocationCreate {
  rackId: string;
  xPosition?: string;
  yPosition?: string;
  status?: number;
}

export interface IDeviceLocationUpdate extends Partial<IDeviceLocationCreate> {
  id: string;
}

export interface IDeviceLocationListRequest extends IPaginationRequest {
  rackId?: string;
  status?: number;
}

export interface IDeviceLocationListResponse
  extends IPaginationResponse<IDeviceLocation> {
  data: IDeviceLocation[];
}
