"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Search,
  Mail,
  CalendarDays,
  UserCheck,
  Copy,
  Check,
  TicketX,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { type Ticket as TicketModel, type TicketStage, deriveTicketStage } from "@/models/ticket";
import ticketStatuses from "@/config/ticket-statuses.json";

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
  new: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  assigned:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  payment_sent:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  paid: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800",
  boarded:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
};

const stagePillActive: Record<TicketStage | "all", string> = {
  all: "bg-foreground text-background",
  new: "bg-zinc-700 text-zinc-50 dark:bg-zinc-300 dark:text-zinc-900",
  assigned: "bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950",
  payment_sent: "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
  paid: "bg-green-600 text-white dark:bg-green-400 dark:text-green-950",
  boarded: "bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950",
};

function getStageLabel(stage: TicketStage): string {
  return ticketStatuses.find((s) => s.id === stage)?.label ?? stage;
}

export function AdminEventTicketsTab({ eventId }: Props) {
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<TicketStage | "all">("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/events/${eventId}/tickets`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTickets(data.tickets ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const stageCounts = useMemo(() => {
    const counts: Record<TicketStage | "all", number> = {
      all: tickets.length,
      new: 0,
      assigned: 0,
      payment_sent: 0,
      paid: 0,
      boarded: 0,
    };
    tickets.forEach((t) => {
      counts[deriveTicketStage(t)]++;
    });
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
      const matchesStage =
        stageFilter === "all" || deriveTicketStage(t) === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [tickets, search, stageFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const isActive = stageFilter === s.id;
          const count = stageCounts[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setStageFilter(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? stagePillActive[s.id]
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label}
              <span
                className={`rounded-full px-1.5 py-0 text-[10px] font-semibold ${
                  isActive
                    ? "bg-white/20 text-inherit"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by ticket number, name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Result count */}
      {(search || stageFilter !== "all") && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {tickets.length} tickets
        </p>
      )}

      {/* Tickets */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <TicketX className="h-10 w-10" />
          <p className="text-sm">
            {search || stageFilter !== "all"
              ? "No tickets match your search."
              : "No tickets issued yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TicketCard({ ticket: t }: { ticket: TicketModel }) {
  const stage = deriveTicketStage(t);
  const [copied, setCopied] = useState(false);

  function copyTicketNumber() {
    navigator.clipboard.writeText(t.ticketNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Stage accent bar */}
          <div
            className={`w-full sm:w-1.5 shrink-0 ${
              stage === "boarded"
                ? "bg-purple-500"
                : stage === "paid"
                ? "bg-green-500"
                : stage === "payment_sent"
                ? "bg-amber-400"
                : stage === "assigned"
                ? "bg-blue-500"
                : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          />

          <div className="flex-1 px-4 py-3 space-y-2">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Ticket number with copy */}
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold tracking-wide">
                  {t.ticketNumber}
                </span>
                <button
                  onClick={copyTicketNumber}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy ticket number"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Stage badge */}
              <Badge
                variant="outline"
                className={`text-xs ${stageStyle[stage]}`}
              >
                {getStageLabel(stage)}
              </Badge>

              {/* Date */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateShort(t.issuedAt)}
              </span>
            </div>

            {/* Attendee info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{t.issuedToName}</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {t.issuedToEmail}
              </span>
            </div>

            {/* Lifecycle details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {t.assignedToId && (
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                  Assigned {t.assignedAt ? formatDateShort(t.assignedAt) : ""}
                </span>
              )}
              {t.paymentSentAt && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  ↗ Payment sent {formatDateShort(t.paymentSentAt)}
                </span>
              )}
              {t.paidAt && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  ✓ Paid {formatDateShort(t.paidAt)}
                </span>
              )}
              {t.boardedAt && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  ✓ Boarded {formatDateShort(t.boardedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
