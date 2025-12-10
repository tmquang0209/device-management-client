'use client';

import { DashboardLayout } from '@/shared/components/layout/admin/dashboard-layout';
import { SidebarProvider } from "@/shared/context/sidebar.context";

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  return (
    <SidebarProvider>
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </DashboardLayout>
    </SidebarProvider>
  );
}