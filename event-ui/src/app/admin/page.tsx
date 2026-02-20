"use client";

import { AdminEventTable } from "@/components/admin/AdminEventTable";
import { mockEvents } from "@/mock/events";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-1">
          Manage all events in the system
        </p>
      </div>

      <AdminEventTable events={mockEvents} />
    </div>
  );
}
