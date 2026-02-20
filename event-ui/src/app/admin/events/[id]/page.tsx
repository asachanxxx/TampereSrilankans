"use client";

import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { AdminEventSummaryCards } from "@/components/admin/AdminEventSummaryCards";
import { EmptyState } from "@/components/events/EmptyState";
import { mockEvents } from "@/mock/events";

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const event = mockEvents.find((e) => e.id === params.id);

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
