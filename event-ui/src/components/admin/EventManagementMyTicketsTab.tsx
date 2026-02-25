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
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { type Ticket as TicketModel, deriveTicketStage } from "@/models/ticket";
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

export function EventManagementMyTicketsTab({ eventId, currentUserId }: Props) {
  const [tickets, setTickets] = useState<TicketModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.issuedToName.toLowerCase().includes(q) ||
        t.issuedToEmail.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const handlePaymentSent = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/payment-sent`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { ticket, paymentMessage: msg } = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      if (msg) setPaymentMessage(msg);
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
      {/* Count summary */}
      <p className="text-sm text-muted-foreground">
        {tickets.length === 0
          ? "No tickets assigned to you for this event."
          : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} assigned to you`}
      </p>

      {/* Search */}
      {tickets.length > 0 && (
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

      {filtered.length === 0 && search ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <TicketX className="h-8 w-8 opacity-30" />
          <p className="text-sm">No matches found</p>
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
                  <div className="flex gap-2 pt-1">
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
      {paymentMessage && (
        <PaymentMessageDialog
          paymentMessage={paymentMessage}
          open={!!paymentMessage}
          onClose={() => setPaymentMessage(null)}
        />
      )}
    </div>
  );
}
