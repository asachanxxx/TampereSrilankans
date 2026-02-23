"use client";

import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EventManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
        <p className="text-muted-foreground mt-1">
          Advanced event management tools for administrators
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="font-semibold text-lg">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Event management features are under development. Check back soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
