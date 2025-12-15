"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Grid3x3, MapPin, Package2 } from "lucide-react";

interface InventoryOverviewProps {
  counts?: {
    deviceTypes: number;
    deviceLocations: number;
    racks: number;
    suppliers: number;
    partners: number;
  };
  loading?: boolean;
}

export function InventoryOverview({ counts, loading }: InventoryOverviewProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="bg-muted h-48" />
      </Card>
    );
  }

  const items = [
    {
      label: "Loại thiết bị",
      value: counts?.deviceTypes || 0,
      icon: Package2,
      color: "text-purple-600",
    },
    {
      label: "Vị trí lưu trữ",
      value: counts?.deviceLocations || 0,
      icon: MapPin,
      color: "text-blue-600",
    },
    {
      label: "Kệ",
      value: counts?.racks || 0,
      icon: Grid3x3,
      color: "text-green-600",
    },
    {
      label: "Nhà cung cấp",
      value: counts?.suppliers || 0,
      icon: Building2,
      color: "text-orange-600",
    },
    {
      label: "Đối tượng",
      value: counts?.partners || 0,
      icon: Building2,
      color: "text-red-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan kho thiết bị</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-muted/20 flex flex-col items-center rounded-lg border p-4"
              >
                <Icon className={`h-6 w-6 ${item.color} mb-2`} />
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-muted-foreground text-center text-xs">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default InventoryOverview;
