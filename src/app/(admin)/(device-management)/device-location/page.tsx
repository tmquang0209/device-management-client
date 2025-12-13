"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceLocationTab } from "@/shared/components/admin/device-location/device-location-tab";
import { RackTab } from "@/shared/components/admin/device-location/rack-tab";
import { useEffect, useState } from "react";

export default function DeviceLocationPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"rack" | "location">("rack");

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quản Lý Vị Trí Lưu Trữ</h1>
        <p className="text-muted-foreground">
          Quản lý kệ lưu trữ và vị trí lưu trữ thiết bị trong hệ thống
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "rack" | "location")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rack">Quản Lý Kệ Lưu Trữ</TabsTrigger>
          <TabsTrigger value="location">Quản Lý Vị Trí Lưu Trữ</TabsTrigger>
        </TabsList>

        <TabsContent value="rack" className="mt-6">
          <RackTab mounted={mounted} />
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <DeviceLocationTab mounted={mounted} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
