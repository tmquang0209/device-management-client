"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IAuditLogs } from "@/shared/interfaces/audit-logs.interface";
import dayjs from "dayjs";

interface IAuditLogDetailsModalProps {
  log: IAuditLogs | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AuditLogDetailsModal({
  log,
  isOpen,
  onOpenChange,
}: Readonly<IAuditLogDetailsModalProps>) {
  if (!log) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-11/12 max-w-7xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about the recorded action.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Action Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Action
                    </span>
                    <span className="text-sm">{log.action}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </span>
                    <Badge
                      variant={
                        log.status === "success" ? "default" : "destructive"
                      }
                      className="w-fit"
                    >
                      {log.status}
                    </Badge>
                  </div>
                  {log.createdAt && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Timestamp
                      </span>
                      <span className="font-mono text-sm">
                        {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss.SSS")}
                      </span>
                    </div>
                  )}
                  {log.reason && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Reason
                      </span>
                      <span className="text-sm">{log.reason}</span>
                    </div>
                  )}
                  {log.latencyMs && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Latency
                      </span>
                      <span className="font-mono text-sm">
                        {log.latencyMs}ms
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Actor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actor Type
                    </span>
                    <span className="text-sm">{log.actorType}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actor Name
                    </span>
                    <span className="text-sm">{log.actorName || "N/A"}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actor ID
                    </span>
                    <span className="font-mono text-sm">
                      {log.actorId || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Resource Type
                    </span>
                    <span className="text-sm">{log.resourceType}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Resource ID
                    </span>
                    <span className="font-mono text-sm">
                      {log.resourceId || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Request Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      IP Address
                    </span>
                    <span className="font-mono text-sm">{log.ip || "N/A"}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Origin
                    </span>
                    <span className="text-sm">{log.origin || "N/A"}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      User Agent
                    </span>
                    <span className="text-xs leading-relaxed break-all text-gray-600 dark:text-gray-400">
                      {log.userAgent || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            {log.requestSnapshot &&
              Object.keys(log.requestSnapshot).length > 0 && (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Request Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {JSON.stringify(log.requestSnapshot, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            {(() => {
              const diff = log.diffJson as Record<string, unknown> | null;
              return diff && Object.keys(diff).length > 0 ? (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Changes (Diff)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {JSON.stringify(diff, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}