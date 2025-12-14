"use client";

import { Card } from "@/components/ui/card";
import { RackTab } from "@/shared/components/admin/device-location/rack-tab";
import { useEffect, useState } from "react";

export default function DeviceLocationPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="bg-white p-6 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Quản Lý Vị Trí Lưu Trữ</h1>
        <p className="text-muted-foreground">
          Quản lý các vị trí lưu trữ thiết bị trong hệ thống
        </p>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white p-6 dark:bg-gray-800">
      <div>
        <h1 className="text-2xl font-bold">Quản Lý Kệ Lưu Trữ</h1>
        <p className="text-muted-foreground">Quản lý danh sách kệ lưu trữ</p>
      </div>
      <RackTab mounted={mounted} />
    </Card>
  );
}
