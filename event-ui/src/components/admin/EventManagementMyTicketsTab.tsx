"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Mail,
  CalendarDays,
  TicketX,
  Send,
  CheckCircle,
  Ticket as TicketIcon,
  Eye,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { type Ticket as TicketModel, type TicketStage, deriveTicketStage } from "@/models/ticket";
import ticketStatuses from "@/config/ticket-statuses.json";
import { PaymentMessageDialog } from "./PaymentMessageDialog";

interface Props {
  eventId: string;
  currentUserId: string;
}

const stageStyle: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-600 border-zinc-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  payment_sent: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  boarded: "bg-purple-50 text-purple-700 border-purple-200",
};

const STAGE_FILTERS: { id: TicketStage | "all" | "needs_action"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_action", label: "Needs Action" },
  { id: "assigned", label: "Assigned" },
  { id: "payment_sent", label: "Payment Sent" },
  { id: "paid", label: "Paid" },
  { id: "boarded", label: "Boarded" },
];

export function EventManagementMyTicketsTab({ eventId, currentUserId }: Props) {
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<TicketStage | "all" | "needs_action">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentMessages, setPaymentMessages] = useState<{
    whatsappMessage: string;
    emailMessage: string;
    emailSubject: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const handlePreview = async (ticketId: string) => {
    setPreviewLoading(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/payment-preview`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setPaymentMessages(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPreviewLoading(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/events/${eventId}/tickets`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        // Filter to only tickets assigned to the current user
        const mine = (data.tickets ?? []).filter(
          (t: TicketModel) => t.assignedToId === currentUserId
        );
        setTickets(mine);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId, currentUserId]);

  const stats = useMemo(() => ({
    total: tickets.length,
    assigned: tickets.filter(t => deriveTicketStage(t) === "assigned").length,
    payment_sent: tickets.filter(t => deriveTicketStage(t) === "payment_sent").length,
    paid: tickets.filter(t => deriveTicketStage(t) === "paid").length,
    boarded: tickets.filter(t => deriveTicketStage(t) === "boarded").length,
  }), [tickets]);

  const needsAction = stats.assigned + stats.payment_sent;
  const done = stats.paid + stats.boarded;
  const progressPct = stats.total > 0 ? Math.round((done / stats.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tickets.filter((t) => {
      const stage = deriveTicketStage(t);
      const matchesSearch =
        !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.issuedToName.toLowerCase().includes(q) ||
        t.issuedToEmail.toLowerCase().includes(q);
      const matchesStage =
        stageFilter === "all" ||
        (stageFilter === "needs_action" ? stage === "assigned" || stage === "payment_sent" : stage === stageFilter);
      return matchesSearch && matchesStage;
    });
  }, [tickets, search, stageFilter]);

  const handlePaymentSent = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/payment-sent`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { ticket, whatsappMessage, emailMessage, emailSubject } = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      if (whatsappMessage) setPaymentMessages({ whatsappMessage, emailMessage, emailSubject });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/paid`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { ticket } = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
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
      {/* Stats row */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.assigned}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Assigned</p>
            </div>
            <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.payment_sent}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Payment Sent</p>
            </div>
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{done}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Paid / Boarded</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{needsAction > 0 ? `${needsAction} need action` : "All actioned"}</span>
              <span>{progressPct}% complete</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage filter pills */}
      {tickets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {STAGE_FILTERS.map(({ id, label }) => {
            const count =
              id === "all" ? stats.total :
              id === "needs_action" ? needsAction :
              id === "assigned" ? stats.assigned :
              id === "payment_sent" ? stats.payment_sent :
              id === "paid" ? stats.paid :
              id === "boarded" ? stats.boarded : 0;
            const isActive = stageFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStageFilter(id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <TicketIcon className="h-8 w-8 opacity-30" />
          <p className="text-sm">No tickets assigned to you for this event.</p>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search your tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 && (search || stageFilter !== "all") ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <TicketX className="h-8 w-8 opacity-30" />
          <p className="text-sm">No tickets match the current filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const stage = deriveTicketStage(ticket);
            const isActioning = actionLoading === ticket.id;
            const stageLabel = ticketStatuses.find((s) => s.id === stage)?.label ?? stage;

            return (
              <Card key={ticket.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                      <p className="font-medium truncate">{ticket.issuedToName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {ticket.issuedToEmail}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${stageStyle[stage]}`}>
                      {stageLabel}
                    </Badge>
                  </div>

                  {/* Timestamps */}
                  {(ticket.assignedAt || ticket.paymentSentAt || ticket.paidAt) && (
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
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
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(ticket.id)}
                      disabled={previewLoading === ticket.id}
                      className="gap-1.5 text-muted-foreground"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Message
                    </Button>
                    {stage === "assigned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePaymentSent(ticket.id)}
                        disabled={isActioning}
                        className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <Send className="h-4 w-4" />
                        Send Payment Details
                      </Button>
                    )}
                    {stage === "payment_sent" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePaymentSent(ticket.id)}
                          disabled={isActioning}
                          className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <Send className="h-4 w-4" />
                          Resend Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaid(ticket.id)}
                          disabled={isActioning}
                          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Paid
                        </Button>
                      </>
                    )}
                    {(stage === "paid" || stage === "boarded") && (
                      <Badge
                        variant="outline"
                        className="text-green-700 border-green-300 bg-green-50 text-xs px-2.5 py-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Payment confirmed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment message modal */}
      {paymentMessages && (
        <PaymentMessageDialog
          whatsappMessage={paymentMessages.whatsappMessage}
          emailMessage={paymentMessages.emailMessage}
          emailSubject={paymentMessages.emailSubject}
          open={!!paymentMessages}
          onClose={() => setPaymentMessages(null)}
        />
      )}
    </div>
  );
}
