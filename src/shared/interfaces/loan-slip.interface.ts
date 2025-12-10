import { IPaginationRequest } from "./pagination.interface";
import { IPartner } from "./partner.interface";

export interface ILoanSlipDevice {
  id: string;
  deviceName: string;
  serial?: string;
  model?: string;
}

export interface ILoanSlipDetail {
  id: string;
  equipmentLoanSlipId: string;
  deviceId: string;
  status: number; // 1: BORROWED, 2: RETURNED, 3: BROKEN
  returnDate?: Date;
  note?: string;
  device?: ILoanSlipDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanSlipBase {
  borrowerId: string;
  loanerId: string;
  expectedReturnDate: Date;
  deviceIds: string[];
}

export type ILoanSlipCreate = ILoanSlipBase;

export interface ILoanSlipUpdate extends Partial<ILoanSlipBase> {
  id: string;
}

export interface ILoanSlip {
  id: string;
  equipmentBorrowerId: string;
  equipmentLoanerId: string;
  status: number; // 1: BORROWING, 2: CLOSED, 3: CANCELLED
  expectedReturnDate?: Date;
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
