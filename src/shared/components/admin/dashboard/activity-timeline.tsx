"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User } from "lucide-react";

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  date: string;
  user?: string;
}

interface ActivityTimelineProps {
  activities?: RecentActivity[];
  loading?: boolean;
}

export function ActivityTimeline({
  activities,
  loading,
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="bg-muted h-64" />
      </Card>
    );
  }

  const getTypeBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("loan") || lowerType.includes("borrow"))
      return "bg-blue-500";
    if (lowerType.includes("return")) return "bg-green-500";
    if (lowerType.includes("maintenance")) return "bg-orange-500";
    if (lowerType.includes("create")) return "bg-purple-500";
    if (lowerType.includes("update")) return "bg-yellow-500";
    if (lowerType.includes("delete")) return "bg-red-500";
    return "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex gap-4 border-b pb-4 last:border-0"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`h-2 w-2 rounded-full ${getTypeBadgeColor(activity.type)} mt-2`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      {activity.message}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      {activity.user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{activity.user}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Chưa có hoạt động nào
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ActivityTimeline;
