"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TicketQRCode } from "@/components/events/TicketQRCode";
import { useSession } from "@/state/session";
import { Event } from "@/models/event";
import { Ticket } from "@/models/ticket";
import { Loader2 } from "lucide-react";

export default function UserEventDetailPage({ params }: { params: { id: string } }) {
  const { currentUser, authStatus } = useSession();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/me");
      return;
    }
    if (authStatus !== "authenticated") return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventRes, ticketRes] = await Promise.all([
          fetch(`/api/events/${params.id}`),
          fetch(`/api/tickets?eventId=${params.id}`),
        ]);

        if (!eventRes.ok) {
          setNotFound(true);
          return;
        }

        const { event: fetchedEvent } = await eventRes.json();
        setEvent(fetchedEvent);

        if (ticketRes.ok) {
          const { ticket: fetchedTicket } = await ticketRes.json();
          setTicket(fetchedTicket ?? null);
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, authStatus]);

  if (loading || authStatus === "loading") {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !event) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-6xl px-4 py-8 text-center">
          <p className="text-muted-foreground">Event not found.</p>
          <Button className="mt-4" onClick={() => router.push("/me")}>
            Back to My Events
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <EventDetailHeader event={event} />
            <EventMetaRow event={event} />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                About This Event
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar with Ticket */}
          <div className="space-y-6">
            {ticket ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Ticket Number
                    </div>
                    <div className="font-mono text-sm mt-1">
                      {ticket.ticketNumber}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Issued To
                    </div>
                    <div className="text-sm mt-1">{ticket.issuedToName}</div>
                    <div className="text-sm text-muted-foreground">
                      {ticket.issuedToEmail}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      QR Code
                    </div>
                    <TicketQRCode
                      ticketNumber={ticket.ticketNumber}
                      eventId={event.id}
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Scan this code at the event entrance
                    </p>
                  </div>
                  <Button className="w-full" disabled>
                    Download Ticket (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You don't have a ticket for this event yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
