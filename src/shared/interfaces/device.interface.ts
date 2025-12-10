import { IPaginationRequest } from "./pagination.interface";

export interface IDeviceType {
  id: string;
  deviceTypeName: string;
  description?: string;
}

export interface IDeviceLocation {
  id: string;
  xPosition?: string;
  yPosition?: string;
  status: number;
}

export interface IRack {
  id: string;
  code: string;
  status: number;
  deviceLocations?: IDeviceLocation[];
}

export interface ISupplier {
  id: string;
  supplierName: string;
  contactInfo?: string;
}

export interface IDeviceBase {
  deviceName: string;
  serial?: string;
  model?: string;
  deviceTypeId: string;
  rackId?: string;
  supplierId?: string;
  status?: number;
  purchaseDate?: Date;
  warrantyExpirationDate?: Date;
  notes?: string;
}

export type IDeviceCreate = IDeviceBase;

export interface IDeviceUpdate extends Partial<IDeviceBase> {
  id: string;
}

export interface IDevice extends IDeviceBase {
  id: string;
  deviceType?: IDeviceType;
  rack?: IRack;
  supplier?: ISupplier;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceListRequest extends IPaginationRequest {
  skip?: number;
  take?: number;
  deviceName?: string;
  deviceTypeId?: string;
  rackId?: string;
  status?: number;
}
