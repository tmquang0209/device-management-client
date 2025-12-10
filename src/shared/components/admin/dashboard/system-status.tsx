"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

const systemStatus = [
  {
    id: 1,
    service: "Web Server",
    status: "online",
    uptime: "99.9%",
    lastCheck: "1 minute ago",
  },
  {
    id: 2,
    service: "Database Server",
    status: "online",
    uptime: "99.8%",
    lastCheck: "2 minutes ago",
  },
  {
    id: 3,
    service: "Payment Gateway",
    status: "warning",
    uptime: "98.5%",
    lastCheck: "3 minutes ago",
  },
  {
    id: 4,
    service: "Email Service",
    status: "online",
    uptime: "99.7%",
    lastCheck: "1 minute ago",
  },
  {
    id: 5,
    service: "Backup Service",
    status: "maintenance",
    uptime: "95.2%",
    lastCheck: "10 minutes ago",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "online":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "offline":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "maintenance":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "online":
      return <Badge variant="default" className="bg-green-100 text-green-700">Online</Badge>;
    case "warning":
      return <Badge variant="default" className="bg-yellow-100 text-yellow-700">Warning</Badge>;
    case "offline":
      return <Badge variant="destructive">Offline</Badge>;
    case "maintenance":
      return <Badge variant="default" className="bg-blue-100 text-blue-700">Maintenance</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function SystemStatus() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemStatus.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="text-sm font-medium">{service.service}</p>
                  <p className="text-xs text-muted-foreground">
                    Uptime: {service.uptime} • Last check: {service.lastCheck}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(service.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}