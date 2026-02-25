"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Users, CheckCircle2 } from "lucide-react";

interface Props {
  eventId: string;
}

interface Stats {
  ticketCount: number;
  registrationCount: number;
  boardedCount: number;
}

export function AdminEventSummaryCards({ eventId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/events/${eventId}/attendees`).then((r) => r.json()),
      fetch(`/api/admin/events/${eventId}/tickets`).then((r) => r.json()),
    ]).then(([attendeesData, ticketsData]) => {
      const registrations = attendeesData.registrations ?? [];
      const tickets = ticketsData.tickets ?? [];
      const boardedCount = tickets.filter(
        (t: any) => t.boardingStatus === "boarded"
      ).length;
      setStats({
        registrationCount: registrations.length,
        ticketCount: tickets.length,
        boardedCount,
      });
    });
  }, [eventId]);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const boardingPct =
    stats.ticketCount > 0
      ? Math.round((stats.boardedCount / stats.ticketCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets Issued</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ticketCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.boardedCount} boarded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registrations</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.registrationCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.ticketCount} tickets generated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Boarding Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{boardingPct}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.boardedCount} of {stats.ticketCount} boarded
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
