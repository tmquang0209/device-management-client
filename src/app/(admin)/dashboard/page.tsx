import { AccessChart } from "@/shared/components/admin/dashboard/access-chart";
import { DashboardStats } from "@/shared/components/admin/dashboard/dashboard-stats";
import { RecentActivities } from "@/shared/components/admin/dashboard/recent-activities";
import { SystemStats } from "@/shared/components/admin/dashboard/system-stats";
import { SystemStatus } from "@/shared/components/admin/dashboard/system-status";

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your system&apos;s key metrics and controls
        </p>
      </div>

      {/* Main Statistics - Users, Payments, Access, Security */}
      <DashboardStats />

      {/* System Performance Statistics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          System Performance
        </h2>
        <SystemStats />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Access Chart */}
        <AccessChart />
      </div>

      {/* System Monitoring and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Activities */}
        <RecentActivities />

        {/* System Status Monitor */}
        <SystemStatus />
      </div>

      {/* Additional Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Quick Links */}
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            View and manage all users in the system
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active users:</span>
              <span className="font-medium">12,345</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Locked accounts:</span>
              <span className="font-medium text-red-600">23</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>New registrations today:</span>
              <span className="font-medium text-green-600">156</span>
            </div>
          </div>
        </div>

        {/* Payment Analytics */}
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            Payment Analytics
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Monitor transactions and payment gateway
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Successful transactions:</span>
              <span className="font-medium text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Failed transactions:</span>
              <span className="font-medium text-red-600">1.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Today&apos;s revenue:</span>
              <span className="font-medium">$45.2K</span>
            </div>
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            Security Overview
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Monitor system security status
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Failed logins:</span>
              <span className="font-medium text-yellow-600">45</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Blocked IPs:</span>
              <span className="font-medium text-red-600">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Security alerts:</span>
              <span className="font-medium text-orange-600">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
