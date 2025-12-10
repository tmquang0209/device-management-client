import { IPaginationRequest } from "./pagination.interface";

export interface IPartnerUser {
  id: string;
  fullName: string;
  email: string;
}

export interface IPartner {
  id: string;
  partnerType: number;
  userId?: string;
  status: number;
  user?: IPartnerUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPartnerBase {
  partnerType: number;
  userId?: string;
  status?: number;
}

export type IPartnerCreate = IPartnerBase;

export interface IPartnerUpdate extends Partial<IPartnerBase> {
  id: string;
}

export interface IPartnerListRequest extends IPaginationRequest {
  partnerType?: number;
  userId?: string;
  status?: number;
}
