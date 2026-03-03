"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { type Ticket, deriveTicketStage } from "@/models/ticket";
import { type Registration } from "@/models/registration";

interface Props {
  eventId: string;
}

interface TicketStats {
  total: number;
  assigned: number;
  paymentSent: number;
  paid: number;
  boarded: number;
}

interface AttendeeStats {
  total: number;
  vegMeals: number;
  nonVegMeals: number;
  kidsMeals: number;
  children: number;
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] leading-tight mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

export function EventAdminStatusBar({ eventId }: Props) {
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [attendeeStats, setAttendeeStats] = useState<AttendeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/events/${eventId}/tickets`).then((r) => r.json()),
      fetch(`/api/admin/events/${eventId}/attendees`).then((r) => r.json()),
    ])
      .then(([ticketData, attendeeData]) => {
        const tickets: Ticket[] = ticketData.tickets ?? [];
        const ts: TicketStats = { total: tickets.length, assigned: 0, paymentSent: 0, paid: 0, boarded: 0 };
        tickets.forEach((t) => {
          const stage = deriveTicketStage(t);
          if (stage === "assigned") ts.assigned++;
          else if (stage === "payment_sent") ts.paymentSent++;
          else if (stage === "paid") ts.paid++;
          else if (stage === "boarded") ts.boarded++;
        });
        setTicketStats(ts);

        const regs: Registration[] = attendeeData.registrations ?? [];
        const as: AttendeeStats = { total: regs.length, vegMeals: 0, nonVegMeals: 0, kidsMeals: 0, children: 0 };
        regs.forEach((r) => {
          as.vegMeals += r.vegetarianMealCount ?? 0;
          as.nonVegMeals += r.nonVegetarianMealCount ?? 0;
          as.kidsMeals += r.kidsMealCount ?? 0;
          as.children += (r.childrenUnder7Count ?? 0) + (r.childrenOver7Count ?? 0);
        });
        setAttendeeStats(as);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 border-b">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticketStats || !attendeeStats) return null;

  return (
    <div className="border-b bg-muted/30 px-4 py-3 space-y-3">
      {/* Ticket stats */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Tickets</p>
        <div className="grid grid-cols-5 gap-1.5">
          <StatTile label="Total" value={ticketStats.total} color="bg-muted text-foreground" />
          <StatTile label="Assigned" value={ticketStats.assigned} color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
          <StatTile label="Pmt Sent" value={ticketStats.paymentSent} color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
          <StatTile label="Paid" value={ticketStats.paid} color="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" />
          <StatTile label="Boarded" value={ticketStats.boarded} color="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" />
        </div>
      </div>

      {/* Attendee stats */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Attendees</p>
        <div className="grid grid-cols-5 gap-1.5">
          <StatTile label="Total" value={attendeeStats.total} color="bg-muted text-foreground" />
          <StatTile label="Veg Meals" value={attendeeStats.vegMeals} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
          <StatTile label="Non-Veg" value={attendeeStats.nonVegMeals} color="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" />
          <StatTile label="Kids Meals" value={attendeeStats.kidsMeals} color="bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300" />
          <StatTile label="Children" value={attendeeStats.children} color="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" />
        </div>
      </div>
    </div>
  );
}
