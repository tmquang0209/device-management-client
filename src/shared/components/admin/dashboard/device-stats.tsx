"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Package, Server } from "lucide-react";

interface DeviceStatsProps {
  counts?: {
    devices: number;
    activeDevices: number;
    devicesOnLoan: number;
    devicesInMaintenance: number;
    users: number;
  };
  loading?: boolean;
}

export function DeviceStats({ counts, loading }: DeviceStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="bg-muted h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Tổng thiết bị",
      value: counts?.devices || 0,
      description: "Tất cả thiết bị trong hệ thống",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Thiết bị khả dụng",
      value: counts?.activeDevices || 0,
      description: "Sẵn sàng cho mượn",
      icon: Server,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Đang cho mượn",
      value: counts?.devicesOnLoan || 0,
      description: "Thiết bị đang được sử dụng",
      icon: HardDrive,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Đang bảo trì",
      value: counts?.devicesInMaintenance || 0,
      description: "Thiết bị đang sửa chữa",
      icon: HardDrive,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default DeviceStats;
