import { ILoanSlipDevice } from "./loan-slip.interface";
import { IPaginationRequest } from "./pagination.interface";
import { IPartner } from "./partner.interface";

/**
 * Return Slip Status Enum
 * 1: RETURNED - Đã nhập kho
 * 2: CANCELLED - Đã hủy
 */
export enum EReturnSlipStatus {
  RETURNED = 1,
  CANCELLED = 2,
}

export interface IReturnSlipDevice {
  id: string;
  deviceName: string;
  serial?: string;
  model?: string;
  deviceType?: {
    id: string;
    name: string;
  };
}

export interface IReturnSlipDetail {
  id: string;
  equipmentReturnSlipId: string;
  deviceId: string;
  note?: string;
  device?: IReturnSlipDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnSlip {
  id: string;
  code: string;
  equipmentLoanSlipId: string;
  returnerId: string;
  returnDate: Date;
  status: EReturnSlipStatus;
  note?: string;
  details?: IReturnSlipDetail[];
  loanSlip?: {
    id: string;
    code: string;
    status: number;
  };
  returner?: IPartner;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  modifiedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnSlipDeviceItem {
  deviceId: string;
  note?: string;
}

export interface IReturnSlipCreate {
  loanSlipId: string;
  returnerId: string;
  returnDate: string;
  note?: string;
  devices: IReturnSlipDeviceItem[];
}

export interface IReturnSlipUpdate {
  returnerId?: string;
  note?: string;
}

export interface IReturnSlipListRequest extends IPaginationRequest {
  loanSlipId?: string;
  returnerId?: string;
  status?: number;
}

export interface IAvailableDeviceForReturn {
  id: string;
  deviceId: string;
  device: ILoanSlipDevice;
  status: number;
}

export interface IAvailableLoanSlip {
  id: string;
  code: string;
  status: number;
  borrower?: IPartner;
  loaner?: IPartner;
}
