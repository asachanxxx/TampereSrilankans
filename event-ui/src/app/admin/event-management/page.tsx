"use client";

import { useState } from "react";
import { useSession } from "@/state/session";
import { Event } from "@/models/event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { EventManagementPicker } from "@/components/admin/EventManagementPicker";
import { EventWorkspaceHeader } from "@/components/admin/EventWorkspaceHeader";
import { EventManagementAttendeesTab } from "@/components/admin/EventManagementAttendeesTab";
import { EventManagementAllTicketsTab } from "@/components/admin/EventManagementAllTicketsTab";
import { EventManagementMyTicketsTab } from "@/components/admin/EventManagementMyTicketsTab";

function isOrganizer(role?: string) {
  return role === "organizer" || role === "moderator" || role === "admin";
}

export default function EventManagementPage() {
  const { authStatus, profile } = useSession();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Loading state
  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Auth guard (layout already handles redirect, this is belt-and-suspenders)
  if (!profile || !isOrganizer(profile.role)) {
    return null;
  }

  const isAdmin = profile.role === "admin";

  // ─── Event picker phase ───────────────────────────────────────────────────
  if (!selectedEvent) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin
              ? "Select an active event to manage attendees, tickets, and assignments."
              : "Select an event to view your assigned tickets and process payments."}
          </p>
        </div>
        <EventManagementPicker onSelect={setSelectedEvent} />
      </div>
    );
  }

  // ─── Workspace phase ──────────────────────────────────────────────────────
  return (
    <div>
      <EventWorkspaceHeader
        event={selectedEvent}
        onChangeEvent={() => setSelectedEvent(null)}
      />

      <div className="p-4 md:p-6">
        {isAdmin ? (
          /* Admin: Attendees + All Tickets */
          <Tabs defaultValue="attendees">
            <TabsList className="mb-4">
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="tickets">All Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="attendees">
              <EventManagementAttendeesTab
                eventId={selectedEvent.id}
                isAdmin={true}
              />
            </TabsContent>

            <TabsContent value="tickets">
              <EventManagementAllTicketsTab eventId={selectedEvent.id} />
            </TabsContent>
          </Tabs>
        ) : (
          /* Organizer / Moderator: Attendees (read-only) + My Tickets */
          <Tabs defaultValue="my-tickets">
            <TabsList className="mb-4">
              <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
            </TabsList>

            <TabsContent value="my-tickets">
              <EventManagementMyTicketsTab
                eventId={selectedEvent.id}
                currentUserId={profile.id}
              />
            </TabsContent>

            <TabsContent value="attendees">
              <EventManagementAttendeesTab
                eventId={selectedEvent.id}
                isAdmin={false}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

