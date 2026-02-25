"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Search,
  Mail,
  CalendarDays,
  TicketX,
  Pencil,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { type Ticket as TicketModel, type TicketStage, deriveTicketStage } from "@/models/ticket";
import ticketStatuses from "@/config/ticket-statuses.json";
import { TicketAssignDropdown } from "./TicketAssignDropdown";
import { TicketStatusControl } from "./TicketStatusControl";
import { TicketEditDialog } from "./TicketEditDialog";

interface Props {
  eventId: string;
}

const STAGES: { id: TicketStage | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "assigned", label: "Assigned" },
  { id: "payment_sent", label: "Payment Sent" },
  { id: "paid", label: "Paid" },
  { id: "boarded", label: "Boarded" },
];

const stageStyle: Record<TicketStage, string> = {
  new: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200",
  assigned: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200",
  payment_sent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200",
  paid: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200",
  boarded: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200",
};

const stagePillActive: Record<TicketStage | "all", string> = {
  all: "bg-foreground text-background",
  new: "bg-zinc-700 text-zinc-50",
  assigned: "bg-blue-600 text-white",
  payment_sent: "bg-amber-500 text-white",
  paid: "bg-green-600 text-white",
  boarded: "bg-purple-600 text-white",
};

function getStageLabel(stage: TicketStage): string {
  return ticketStatuses.find((s) => s.id === stage)?.label ?? stage;
}

export function EventManagementAllTicketsTab({ eventId }: Props) {
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<TicketStage | "all">("all");
  const [editTarget, setEditTarget] = useState<TicketModel | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/events/${eventId}/tickets`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTickets(data.tickets ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const handleTicketUpdate = (updated: TicketModel) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const stageCounts = useMemo(() => {
    const counts: Record<TicketStage | "all", number> = {
      all: tickets.length,
      new: 0, assigned: 0, payment_sent: 0, paid: 0, boarded: 0,
    };
    tickets.forEach((t) => { counts[deriveTicketStage(t)]++; });
    return counts;
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tickets.filter((t) => {
      const matchesSearch =
        !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.issuedToName.toLowerCase().includes(q) ||
        t.issuedToEmail.toLowerCase().includes(q);
      const matchesStage = stageFilter === "all" || deriveTicketStage(t) === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [tickets, search, stageFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setStageFilter(id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              stageFilter === id
                ? stagePillActive[id]
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">({stageCounts[id]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <TicketX className="h-8 w-8 opacity-30" />
          <p className="text-sm">{search ? "No matches" : "No tickets yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const stage = deriveTicketStage(ticket);
            return (
              <Card key={ticket.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                      <p className="font-medium truncate">{ticket.issuedToName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {ticket.issuedToEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-xs ${stageStyle[stage]}`}>
                        {getStageLabel(stage)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditTarget(ticket)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Assignment row */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Assigned to</span>
                    <TicketAssignDropdown
                      ticketId={ticket.id}
                      currentAssignedId={ticket.assignedToId}
                      onAssigned={handleTicketUpdate}
                    />
                  </div>

                  {/* Status control */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Stage</span>
                    <TicketStatusControl
                      eventId={eventId}
                      ticket={ticket}
                      onUpdated={handleTicketUpdate}
                    />
                  </div>

                  {/* Timestamps */}
                  {(ticket.assignedAt || ticket.paymentSentAt || ticket.paidAt || ticket.boardedAt) && (
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t">
                      {ticket.assignedAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Assigned {formatDateShort(ticket.assignedAt)}
                        </span>
                      )}
                      {ticket.paymentSentAt && (
                        <span>Payment sent {formatDateShort(ticket.paymentSentAt)}</span>
                      )}
                      {ticket.paidAt && (
                        <span>Paid {formatDateShort(ticket.paidAt)}</span>
                      )}
                      {ticket.boardedAt && (
                        <span>Boarded {formatDateShort(ticket.boardedAt)}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editTarget && (
        <TicketEditDialog
          eventId={eventId}
          ticket={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            handleTicketUpdate(updated);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
