"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

const accessData = [
  { time: "00:00", visits: 120 },
  { time: "04:00", visits: 80 },
  { time: "08:00", visits: 450 },
  { time: "12:00", visits: 680 },
  { time: "16:00", visits: 920 },
  { time: "20:00", visits: 560 },
];

export function AccessChart() {
  const maxVisits = Math.max(...accessData.map(d => d.visits));

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Daily Access</CardTitle>
        <Activity className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total visits today</span>
            <span className="font-medium text-foreground">18,456</span>
          </div>

          <div className="space-y-2">
            {accessData.map((data) => (
              <div key={data.time} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">{data.time}</span>
                <div className="flex-1 bg-muted rounded-full h-2 relative">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(data.visits / maxVisits) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-12 text-right">{data.visits}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Peak hours: 16:00 - 18:00</span>
              <span>+12.5% from yesterday</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}