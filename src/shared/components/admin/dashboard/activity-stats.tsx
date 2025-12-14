"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, PackageCheck, Wrench } from "lucide-react";

interface ActivityStatsProps {
  counts?: {
    loanSlips: number;
    returnSlips: number;
    maintenanceSlips: number;
    pendingLoanSlips: number;
    pendingMaintenanceSlips: number;
  };
  loading?: boolean;
}

export function ActivityStats({ counts, loading }: ActivityStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="bg-muted h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Phiếu mượn thiết bị",
      total: counts?.loanSlips || 0,
      pending: counts?.pendingLoanSlips || 0,
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Phiếu trả thiết bị",
      total: counts?.returnSlips || 0,
      pending: 0,
      icon: PackageCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Phiếu bảo trì",
      total: counts?.maintenanceSlips || 0,
      pending: counts?.pendingMaintenanceSlips || 0,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} rounded-full p-2`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Tổng số:
                  </span>
                  <span className="text-xl font-bold">
                    {stat.total.toLocaleString()}
                  </span>
                </div>
                {stat.pending > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Đang xử lý:
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      {stat.pending.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ActivityStats;
