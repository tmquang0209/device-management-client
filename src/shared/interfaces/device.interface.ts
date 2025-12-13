import { IDeviceLocationInfo } from "./device-location.interface";
import { IPaginationRequest } from "./pagination.interface";
import { IRack } from "./rack.interface";

export interface IDeviceType {
  id: string;
  deviceTypeName: string;
  description?: string;
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
  deviceLocationId?: string;
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
  deviceLocation?: IDeviceLocationInfo & { rack?: IRack };
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceListRequest extends IPaginationRequest {
  skip?: number;
  take?: number;
  deviceName?: string;
  deviceTypeId?: string;
  deviceLocationId?: string;
  status?: number;
}
