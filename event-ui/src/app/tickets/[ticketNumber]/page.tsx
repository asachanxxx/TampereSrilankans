"use client";

import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TicketQRCode } from "@/components/events/TicketQRCode";
import { Loader2, TicketCheck, TicketX } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import type { Ticket } from "@/models/ticket";

type EventSummary = {
  title: string;
  event_date: string;
  location_name?: string | null;
  city?: string | null;
};

export default function PublicTicketPage({ params }: { params: { ticketNumber: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/tickets?ticketNumber=${encodeURIComponent(params.ticketNumber)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setTicket(data.ticket ?? null);
          setEvent(data.event ?? null);
          if (!data.ticket) setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.ticketNumber]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-md px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !ticket) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <TicketX className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold">Ticket Not Found</h1>
          <p className="text-muted-foreground text-sm">
            No ticket was found for this link. Please check your email for the correct link,
            or contact the event organizer.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const locationParts = [event?.location_name, event?.city].filter(Boolean);

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        {/* Confirmed banner */}
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-6">
          <TicketCheck className="h-5 w-5" />
          <span className="font-medium">Valid Ticket</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{event?.title ?? "Event Ticket"}</CardTitle>
            {event && (
              <p className="text-center text-sm text-muted-foreground">
                {formatDateShort(event.event_date)}
                {locationParts.length > 0 && ` · ${locationParts.join(", ")}`}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Ticket Number</div>
              <div className="font-mono text-sm mt-1">{ticket.ticketNumber}</div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground">Issued To</div>
              <div className="text-sm mt-1">{ticket.issuedToName}</div>
              <div className="text-sm text-muted-foreground">{ticket.issuedToEmail}</div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3">QR Code</div>
              <TicketQRCode ticketNumber={ticket.ticketNumber} eventId={ticket.eventId} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Show this code at the event entrance
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Keep this link safe — it is your ticket. Tampere Sri Lankans Association.
        </p>
      </div>
    </PublicLayout>
  );
}
