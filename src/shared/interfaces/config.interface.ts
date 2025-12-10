import { IPaginatedResponse } from "./common.interface";
import { IPaginationRequest } from "./pagination.interface";

export interface IConfigInfo {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly description?: string;
  readonly isActive?: boolean;
  readonly valueType?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ICreateConfig {
  readonly key: string;
  readonly value: string;
  readonly description?: string;
  readonly isActive?: boolean;
}

export type IUpdateConfig = ICreateConfig

export interface IConfigListRequest extends IPaginationRequest {
  readonly key?: string;
  readonly value?: string;
  readonly description?: string;
  readonly isActive?: boolean;
}

export type IConfigListResponse = IPaginatedResponse<IConfigInfo>
