import { IPaginationRequest } from "@/shared/interfaces";

export interface IBasicUser {
  id: string;
  name: string;
  userName: string;
  email?: string;
  accessToken: string;
  refreshToken: string;
  roleType: string;
  status: boolean;
  partnerId?: string;
}

export interface IUserInfo
  extends Omit<IBasicUser, "accessToken" | "refreshToken"> {
  partner?: {
    id: string;
    partnerType: number;
    status: number;
  };
}

export interface IForgotPassword {
  status: string;
  message: string;
  data: {
    success: boolean;
  };
}

export interface IUserCreate {
  name: string;
  email: string;
  password: string;
  userName?: string;
  roleType?: string;
  status?: boolean;
  partnerId?: string;
}

export interface IUserUpdate extends Partial<IUserCreate> {
  id: string;
}

export interface IChangePassword {
  oldPassword: string;
  newPassword: string;
}

export interface IAuthor {
  id: string;
  name: string;
}

export interface IUserListRequest extends IPaginationRequest {
  id?: string;
  name?: string;
  email?: string;
  userName?: string;
  roleType?: string;
  status?: boolean;
  partnerId?: string;
}
