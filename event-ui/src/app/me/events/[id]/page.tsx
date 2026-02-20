"use client";

import { notFound, redirect } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TicketQRCode } from "@/components/events/TicketQRCode";
import { mockEvents } from "@/mock/events";
import { getUserTicketsForEvent } from "@/mock/tickets";
import { useSession } from "@/state/session";

export default function UserEventDetailPage({ params }: { params: { id: string } }) {
  const { currentUser } = useSession();
  const event = mockEvents.find((e) => e.id === params.id);

  if (!currentUser) {
    redirect("/me");
  }

  if (!event) {
    notFound();
  }

  const ticket = getUserTicketsForEvent(currentUser.id, event.id);

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
