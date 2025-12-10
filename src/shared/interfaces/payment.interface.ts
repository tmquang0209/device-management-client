import { EPaymentMethod, EPaymentStatus, EReconciliationStatus } from "../constants/admin/payment";
import { IPaginatedResponse } from "./common.interface";
import { IPaginationRequest } from "./pagination.interface";

// ============================================
// PAYMENT PROVIDER INTERFACES
// ============================================

export interface IPaymentProviderInfo {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  authorizedKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePaymentProvider {
  code: string;
  name: string;
  isActive?: boolean;
  authorizedKey?: string;
}

export interface IUpdatePaymentProvider extends ICreatePaymentProvider {
  id: string;
}

export interface IPaymentProviderListRequest extends IPaginationRequest {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export type IPaymentProviderListResponse =
  IPaginatedResponse<IPaymentProviderInfo>;

// ============================================
// PAYMENT TRANSACTION INTERFACES
// ============================================

export interface IPaymentTransactionInfo {
  id: string;
  userId?: string;
  providerId: string;
  providerTxnId?: string;
  providerRefId?: string;
  status: EPaymentStatus;
  paymentMethod: EPaymentMethod;
  currency: string;
  amountMinor?: number;
  feeMinor?: number;
  netMinor?: number;
  description?: string;
  idempotencyKey?: string;
  webhookSignatureOk: boolean;
  settlementDate?: Date;
  statementId?: string;
  reconStatus: EReconciliationStatus;
  refundData?: Record<string, unknown>;
  parentTxnUid?: string;
  refundReason?: string;
  expiredAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  lastWebhookAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePaymentTransaction {
  userId?: string;
  providerId: string;
  amountMinor: number;
  currency: string;
  description?: string;
  paymentMethod?: EPaymentMethod;
}

export interface IUpdatePaymentTransaction extends ICreatePaymentTransaction {
  id: string;
  status?: EPaymentStatus;
  reconStatus?: EReconciliationStatus;
}

export interface IPaymentTransactionListRequest extends IPaginationRequest {
  userId?: string;
  providerId?: string;
  status?: EPaymentStatus;
  paymentMethod?: EPaymentMethod;
  reconStatus?: EReconciliationStatus;
  providerTxnId?: string;
}

export type IPaymentTransactionListResponse =
  IPaginatedResponse<IPaymentTransactionInfo>;
