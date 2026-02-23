"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventListGrid } from "@/components/events/EventListGrid";
import { RatingSortDropdown, SortOption } from "@/components/events/RatingSortDropdown";
import { EmptyState } from "@/components/events/EmptyState";
import { Button } from "@/components/ui/button";
import { useSession } from "@/state/session";
import { Loader2 } from "lucide-react";
import type { Event } from "@/models/event";
import type { Registration } from "@/models/registration";

export default function MyEventsPage() {
  const { authStatus, profile } = useSession();
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const loadMyEvents = async () => {
      setDataLoading(true);
      setFetchError("");
      try {
        // 1. Get user's registrations
        const regRes = await fetch("/api/registrations");
        if (!regRes.ok) throw new Error("Failed to load registrations");
        const { registrations }: { registrations: Registration[] } = await regRes.json();

        if (!registrations || registrations.length === 0) {
          setUserEvents([]);
          return;
        }

        // 2. Get all public events
        const evRes = await fetch("/api/events");
        if (!evRes.ok) throw new Error("Failed to load events");
        const { events }: { events: Event[] } = await evRes.json();

        // 3. Cross-reference
        const registeredEventIds = new Set(registrations.map((r) => r.eventId));
        setUserEvents(events.filter((e) => registeredEventIds.has(e.id)));
      } catch (err: any) {
        setFetchError(err.message || "Something went wrong");
      } finally {
        setDataLoading(false);
      }
    };

    loadMyEvents();
  }, [authStatus]);

  // Auth loading
  if (authStatus === "loading") {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-6xl px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  // Not logged in
  if (authStatus === "anonymous" || !profile) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <EmptyState
            title="Please login"
            description="You need to be logged in to view your events."
            icon={undefined}
          />
          <div className="text-center mt-6">
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Sort events
  const sortedEvents = [...userEvents].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating?.average ?? 0) - (a.rating?.average ?? 0);
    } else if (sortBy === "date") {
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    } else {
      const now = Date.now();
      const aDiff = new Date(a.eventDate).getTime() - now;
      const bDiff = new Date(b.eventDate).getTime() - now;
      if (aDiff >= 0 && bDiff < 0) return -1;
      if (aDiff < 0 && bDiff >= 0) return 1;
      if (aDiff >= 0 && bDiff >= 0) return aDiff - bDiff;
      return bDiff - aDiff;
    }
  });

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
            <p className="text-muted-foreground mt-1">Events you're registered for</p>
          </div>
          {sortedEvents.length > 0 && (
            <RatingSortDropdown value={sortBy} onChange={setSortBy} />
          )}
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <EmptyState
            title="Failed to load events"
            description={fetchError}
            icon={undefined}
          />
        ) : sortedEvents.length > 0 ? (
          <EventListGrid events={sortedEvents} baseHref="/me/events" />
        ) : (
          <EmptyState
            title="No events yet"
            description="You haven't registered for any events. Browse our events to find something exciting!"
          />
        )}
      </div>
    </PublicLayout>
  );
}
