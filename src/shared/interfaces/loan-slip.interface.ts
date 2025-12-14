import { IPaginationRequest } from "./pagination.interface";
import { IPartner } from "./partner.interface";

/**
 * Loan Slip Status Enum
 * 1: BORROWING - Đang mượn
 * 2: CLOSED - Đã đóng (đã nhập kho)
 * 3: CANCELLED - Đã hủy
 * 4: PARTIAL_RETURNED - Chưa hoàn tất nhập kho
 */
export enum ELoanSlipStatus {
  BORROWING = 1,
  CLOSED = 2,
  CANCELLED = 3,
  PARTIAL_RETURNED = 4,
}

export interface ILoanSlipDevice {
  id: string;
  deviceName: string;
  serial?: string;
  model?: string;
  deviceType?: {
    id: string;
    name: string;
  };
}

export interface ILoanSlipDetail {
  id: string;
  equipmentLoanSlipId: string;
  deviceId: string;
  status: number; // 1: BORROWED, 2: RETURNED, 3: BROKEN
  returnDate?: Date;
  note?: string;
  returnSlipCode?: string; // Mã phiếu trả (nếu đã trả)
  device?: ILoanSlipDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanSlipBase {
  borrowerId: string;
  loanerId: string;
  deviceIds: string[];
}

export type ILoanSlipCreate = ILoanSlipBase;

export interface ILoanSlipUpdate extends Partial<ILoanSlipBase> {
  id: string;
}

export interface ILoanSlip {
  id: string;
  code: string;
  equipmentBorrowerId: string;
  equipmentLoanerId: string;
  status: ELoanSlipStatus; // 1: BORROWING, 2: CLOSED, 3: CANCELLED, 4: PARTIAL_RETURNED
  totalReturned?: number; // Tổng số thiết bị đã trả
  details?: ILoanSlipDetail[];
  borrower?: IPartner;
  loaner?: IPartner;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnDeviceItem {
  deviceId: string;
  status: number; // 2: RETURNED, 3: BROKEN
  note?: string;
}

export interface IReturnLoanSlip {
  items: IReturnDeviceItem[];
}

export interface ILoanSlipListRequest extends IPaginationRequest {
  borrowerId?: string;
  loanerId?: string;
  status?: number;
}
