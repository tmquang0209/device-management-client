import { IPaginatedResponse } from "./common.interface";
import { IPaginationRequest } from "./pagination.interface";

export interface IAuditLogs {
  id: string;
  tenantId?: string;
  actorType: string;
  actorId?: string | null;
  actorName?: string | null;
  resourceType: string;
  resourceId?: string | null;
  action: string;
  status: 'success' | 'failure';
  reason?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  origin?: string | null;
  latencyMs?: number | null;
  diffJson?: unknown;
  requestSnapshot?: {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLogsListRequest extends IPaginationRequest {
  tenantId?: string;
  actorType?: string;
  actorId?: string;
  actorName?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status?: 'success' | 'failure';
  requestId?: string;
  correlationId?: string;
  ip?: string;
  origin?: string;
}

export type IAuditLogsListResponse = IPaginatedResponse<IAuditLogs>;
