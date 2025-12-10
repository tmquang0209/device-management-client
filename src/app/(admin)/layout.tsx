import { AdminAuthGuard } from "@/shared/components/auth/admin-auth-guard";
import { DashboardLayout } from "@/shared/components/layout/admin/dashboard-layout";
import { SidebarProvider } from "@/shared/context/sidebar.context";
import { Suspense } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        }
      >
        <SidebarProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </SidebarProvider>
      </Suspense>
    </AdminAuthGuard>
  );
}
