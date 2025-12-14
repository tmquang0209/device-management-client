import {
  EMaintenanceSlipDetailStatus,
  IMaintenanceSlipDevice,
} from "./maintenance-slip.interface";
import { IPaginationRequest } from "./pagination.interface";
import { IPartner, IPartnerUser } from "./partner.interface";

/**
 * Maintenance Return Slip Status Enum
 * 1: RETURNED - Đã nhập kho
 * 2: CANCELLED - Đã hủy
 */
export enum EMaintenanceReturnSlipStatus {
  RETURNED = 1,
  CANCELLED = 2,
}

export interface IMaintenanceReturnSlipDevice {
  id: string;
  deviceName: string;
  serial?: string;
  model?: string;
  deviceType?: {
    id: string;
    deviceTypeName: string;
  };
}

export interface IMaintenanceReturnSlipDetail {
  id: string;
  maintenanceReturnSlipId: string;
  deviceId: string;
  note?: string;
  device?: IMaintenanceReturnSlipDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceReturnSlip {
  id: string;
  code: string;
  maintenanceSlipId: string;
  status: EMaintenanceReturnSlipStatus;
  note?: string;
  maintenanceReturnSlipDetails?: IMaintenanceReturnSlipDetail[];
  maintenanceSlip?: {
    id: string;
    code: string;
    status: number;
    partner?: IPartner;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  updater?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceReturnSlipDeviceItem {
  deviceId: string;
  status: EMaintenanceSlipDetailStatus; // 2: RETURNED, 3: BROKEN
  note?: string;
}

export interface IMaintenanceReturnSlipCreate {
  maintenanceSlipId: string;
  returnDate: string;
  note?: string;
  devices: IMaintenanceReturnSlipDeviceItem[];
}

export interface IMaintenanceReturnSlipUpdate {
  note?: string;
}

export interface IMaintenanceReturnSlipListRequest extends IPaginationRequest {
  maintenanceSlipId?: string;
  status?: number;
}

export interface IAvailableDeviceForMaintenanceReturn {
  id: string;
  deviceId: string;
  device: IMaintenanceSlipDevice;
  status: number; // 1: SENT - available for return
}

export interface IAvailableMaintenanceSlip {
  id: string;
  code: string;
  status: number;
  partner?: IPartner;
  createdAt: Date;
  createdByUser: IPartnerUser
}
