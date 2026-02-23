"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { AdminEventSummaryCards } from "@/components/admin/AdminEventSummaryCards";
import { EmptyState } from "@/components/events/EmptyState";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Event } from "@/models/event";

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setEvent(data.event); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventDetailHeader event={event} />

      <EventMetaRow event={event} />

      <AdminEventSummaryCards />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Organizer</div>
              <div className="mt-1">{event.organizerName}</div>
            </div>
            {event.city && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">City</div>
                <div className="mt-1">{event.city}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendees" className="mt-6">
          <EmptyState
            title="No attendees data"
            description="Attendee management coming soon"
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <EmptyState
            title="No tickets data"
            description="Ticket management coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EventDetailHeader event={event} />
      
      <EventMetaRow event={event} />

      <AdminEventSummaryCards />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Organizer
              </div>
              <div className="mt-1">{event.organizerName}</div>
            </div>
            {event.city && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  City
                </div>
                <div className="mt-1">{event.city}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendees" className="mt-6">
          <EmptyState
            title="No attendees data"
            description="Attendee management coming soon"
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <EmptyState
            title="No tickets data"
            description="Ticket management coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
