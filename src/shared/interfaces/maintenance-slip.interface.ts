import { IPaginationRequest } from "@/shared/interfaces";

export interface IMaintenanceSlipInfo {
  id: string;
  deviceId: string;
  transferStatus?: string;
  partnerId?: string;
  reason?: string;
  requestDate?: string | Date;
  status: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  device?: {
    id: string;
    deviceName: string;
    serial?: string;
  };
  partner?: {
    id: string;
    userId?: string;
    partnerType?: string;
  };
}

export interface IMaintenanceSlipCreate {
  deviceId: string;
  transferStatus?: string;
  partnerId?: string;
  reason?: string;
  requestDate?: Date | string;
}

export interface IMaintenanceSlipUpdate {
  id: string;
  deviceId?: string;
  transferStatus?: string;
  partnerId?: string;
  reason?: string;
  requestDate?: Date | string;
  status?: number;
}

export interface IMaintenanceSlipListRequest extends IPaginationRequest {
  deviceId?: string;
  partnerId?: string;
  transferStatus?: string;
  status?: number;
}
