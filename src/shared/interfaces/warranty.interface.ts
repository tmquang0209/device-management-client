import { IPaginationRequest } from "@/shared/interfaces";

export interface IWarrantyInfo {
  id: string;
  deviceId: string;
  reason?: string;
  requestDate?: string | Date;
  status: number; // 1: PENDING, 2: PROCESSING, 3: COMPLETED, 4: REJECTED
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IWarrantyCreate {
  deviceId: string;
  reason: string;
  requestDate: Date | string;
}

export interface IWarrantyUpdate {
  id: string;
  reason?: string;
  requestDate?: Date | string;
  status?: number;
}

export interface IWarrantyListRequest extends IPaginationRequest {
  deviceId?: string;
  status?: number;
}
