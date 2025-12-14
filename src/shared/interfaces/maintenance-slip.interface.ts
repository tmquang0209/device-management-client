import { IPaginationRequest } from "@/shared/interfaces";
import { IPartner, IPartnerUser } from "./partner.interface";

/**
 * Maintenance Slip Status Enum
 * 1: SENDING - Đang gửi bảo hành
 * 2: CLOSED - Đã đóng (đã nhận lại)
 * 3: CANCELLED - Đã hủy
 * 4: PARTIAL_RETURNED - Chưa hoàn tất nhận lại
 */
export enum EMaintenanceSlipStatus {
  SENDING = 1,
  CLOSED = 2,
  CANCELLED = 3,
  PARTIAL_RETURNED = 4,
}

/**
 * Maintenance Slip Detail Status Enum
 * 1: SENT - Thiết bị đã gửi, chưa nhận lại
 * 2: RETURNED - Thiết bị đã nhận lại (hoạt động bình thường)
 * 3: BROKEN - Thiết bị không thể sửa chữa
 */
export enum EMaintenanceSlipDetailStatus {
  SENT = 1,
  RETURNED = 2,
  BROKEN = 3,
}

export interface IMaintenanceSlipDevice {
  id: string;
  deviceName: string;
  serial?: string;
  model?: string;
  deviceType?: {
    id: string;
    deviceTypeName: string;
  };
}

export interface IMaintenanceSlipDetail {
  id: string;
  maintenanceSlipId: string;
  deviceId: string;
  status: EMaintenanceSlipDetailStatus;
  returnDate?: Date;
  note?: string;
  device?: IMaintenanceSlipDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceSlipInfo {
  id: string;
  code: string;
  partnerId?: string;
  reason?: string;
  requestDate?: string | Date;
  status: EMaintenanceSlipStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  details?: IMaintenanceSlipDetail[];
  partner?: IPartner;
  createdByUser?: IPartnerUser;
}

export interface IMaintenanceSlipCreate {
  partnerId?: string;
  reason?: string;
  requestDate?: Date | string;
  deviceIds: string[];
}

export interface IMaintenanceSlipUpdate {
  id: string;
  partnerId?: string;
  reason?: string;
  requestDate?: Date | string;
  status?: EMaintenanceSlipStatus;
}

export interface IReturnDeviceMaintenanceItem {
  deviceId: string;
  status: EMaintenanceSlipDetailStatus; // 2: RETURNED, 3: BROKEN
  note?: string;
}

export interface IReturnMaintenanceSlip {
  items: IReturnDeviceMaintenanceItem[];
}

export interface IMaintenanceSlipListRequest extends IPaginationRequest {
  partnerId?: string;
  status?: EMaintenanceSlipStatus;
}
