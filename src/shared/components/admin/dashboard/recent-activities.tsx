"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentActivities = [
  {
    id: 1,
    user: "John Smith",
    action: "Logged into system",
    type: "login",
    time: "5 minutes ago",
    ip: "192.168.1.100",
  },
  {
    id: 2,
    user: "Jane Doe",
    action: "Made a payment",
    type: "payment",
    time: "15 minutes ago",
    amount: "$250",
  },
  {
    id: 3,
    user: "Mike Johnson",
    action: "Updated account information",
    type: "update",
    time: "30 minutes ago",
  },
  {
    id: 4,
    user: "System",
    action: "Database backup completed",
    type: "system",
    time: "2 hours ago",
  },
  {
    id: 5,
    user: "Sarah Wilson",
    action: "Logged out of system",
    type: "logout",
    time: "3 hours ago",
    ip: "192.168.1.105",
  },
];

const getActivityBadge = (type: string) => {
  switch (type) {
    case "login":
      return <Badge variant="default" className="bg-green-100 text-green-700">Login</Badge>;
    case "logout":
      return <Badge variant="secondary">Logout</Badge>;
    case "payment":
      return <Badge variant="default" className="bg-blue-100 text-blue-700">Payment</Badge>;
    case "update":
      return <Badge variant="default" className="bg-orange-100 text-orange-700">Update</Badge>;
    case "system":
      return <Badge variant="default" className="bg-purple-100 text-purple-700">System</Badge>;
    default:
      return <Badge variant="outline">Other</Badge>;
  }
};

export function RecentActivities() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.user.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user}
                    {activity.ip && ` • IP: ${activity.ip}`}
                    {activity.amount && ` • ${activity.amount}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getActivityBadge(activity.type)}
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}