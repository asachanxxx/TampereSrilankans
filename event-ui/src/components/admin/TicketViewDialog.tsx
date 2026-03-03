"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { TicketQRCode } from "@/components/events/TicketQRCode";
import { formatDateShort } from "@/lib/format";
import type { Ticket as TicketModel } from "@/models/ticket";

interface Props {
  ticket: TicketModel | null;
  onClose: () => void;
}

type EventSummary = {
  title: string;
  event_date: string;
  location_name?: string | null;
  city?: string | null;
};

function PaymentBadge({ status }: { status: TicketModel["paymentStatus"] }) {
  if (status === "paid")
    return <Badge className="bg-green-600 text-white">Paid</Badge>;
  if (status === "payment_sent")
    return <Badge variant="secondary">Payment Sent</Badge>;
  return <Badge variant="destructive">Unpaid</Badge>;
}

function BoardingBadge({ status }: { status: TicketModel["boardingStatus"] }) {
  if (status === "boarded")
    return <Badge className="bg-blue-600 text-white">Boarded ✓</Badge>;
  return <Badge variant="outline">Not Boarded</Badge>;
}

export function TicketViewDialog({ ticket, onClose }: Props) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticket) {
      setEvent(null);
      return;
    }
    setLoading(true);
    fetch(`/api/tickets?ticketNumber=${encodeURIComponent(ticket.ticketNumber)}`)
      .then((r) => r.json())
      .then((data) => setEvent(data.event ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticket?.ticketNumber]);

  const locationParts = [event?.location_name, event?.city].filter(Boolean);

  return (
    <Dialog open={!!ticket} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {loading ? "Loading…" : (event?.title ?? "Event Ticket")}
          </DialogTitle>
          {!loading && event && (
            <p className="text-sm text-muted-foreground">
              {formatDateShort(event.event_date)}
              {locationParts.length > 0 && ` · ${locationParts.join(", ")}`}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Ticket Number</p>
              <p className="font-mono text-sm font-bold mt-0.5">{ticket.ticketNumber}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Issued To</p>
              <p className="text-sm font-medium mt-0.5">{ticket.issuedToName}</p>
              <p className="text-xs text-muted-foreground">{ticket.issuedToEmail}</p>
            </div>

            <Separator />

            <div className="flex gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Payment</p>
                <PaymentBadge status={ticket.paymentStatus} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Boarding</p>
                <BoardingBadge status={ticket.boardingStatus} />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col items-center gap-2">
              <TicketQRCode ticketNumber={ticket.ticketNumber} eventId={ticket.eventId} size={180} />
              <p className="text-xs text-muted-foreground">Show at event entrance</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
