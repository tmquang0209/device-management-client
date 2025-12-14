"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DeviceDistributionProps {
  counts?: {
    devices: number;
    activeDevices: number;
    devicesOnLoan: number;
    devicesInMaintenance: number;
  };
  loading?: boolean;
}

export function DeviceDistribution({
  counts,
  loading,
}: DeviceDistributionProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="bg-muted h-64" />
      </Card>
    );
  }

  const total = counts?.devices || 0;
  const active = counts?.activeDevices || 0;
  const onLoan = counts?.devicesOnLoan || 0;
  const inMaintenance = counts?.devicesInMaintenance || 0;

  const distribution = [
    {
      label: "Khả dụng",
      value: active,
      percentage: total > 0 ? (active / total) * 100 : 0,
      color: "bg-green-500",
    },
    {
      label: "Đang cho mượn",
      value: onLoan,
      percentage: total > 0 ? (onLoan / total) * 100 : 0,
      color: "bg-blue-500",
    },
    {
      label: "Đang bảo trì",
      value: inMaintenance,
      percentage: total > 0 ? (inMaintenance / total) * 100 : 0,
      color: "bg-orange-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ thiết bị</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress value={item.percentage} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full ${item.color} transition-all`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tổng thiết bị:</span>
            <span className="text-2xl font-bold">{total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DeviceDistribution;
