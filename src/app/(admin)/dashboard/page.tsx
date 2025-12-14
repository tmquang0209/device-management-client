"use client";

import { ActivityStats } from "@/shared/components/admin/dashboard/activity-stats";
import { ActivityTimeline } from "@/shared/components/admin/dashboard/activity-timeline";
import { DeviceDistribution } from "@/shared/components/admin/dashboard/device-distribution";
import { DeviceStats } from "@/shared/components/admin/dashboard/device-stats";
import { InventoryOverview } from "@/shared/components/admin/dashboard/inventory-overview";
import { useAdminDashboard } from "@/shared/hooks/useAdminDashboard";

export default function Dashboard() {
  const { counts, activities, loading } = useAdminDashboard();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">
          Dashboard Quản lý Thiết bị
        </h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản lý thiết bị và hoạt động
        </p>
      </div>

      {/* Device Statistics */}
      <DeviceStats counts={counts || undefined} loading={loading} />

      {/* Activity Statistics */}
      <div>
        <h2 className="text-foreground mb-4 text-lg font-semibold">
          Thống kê hoạt động
        </h2>
        <ActivityStats counts={counts || undefined} loading={loading} />
      </div>

      {/* Inventory Overview */}
      <InventoryOverview counts={counts || undefined} loading={loading} />

      {/* Distribution and Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeviceDistribution counts={counts || undefined} loading={loading} />
        <ActivityTimeline activities={activities} loading={loading} />
      </div>
    </div>
  );
}
