"use client";

import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventListGrid } from "@/components/events/EventListGrid";
import { RatingSortDropdown, SortOption } from "@/components/events/RatingSortDropdown";
import { EmptyState } from "@/components/events/EmptyState";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/header/LoginDialog";
import { useSession } from "@/state/session";
import { mockEvents } from "@/mock/events";
import { getUserEventIds } from "@/mock/userEvents";

export default function MyEventsPage() {
  const { currentUser } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date");

  if (!currentUser) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <EmptyState
            title="Please login"
            description="You need to be logged in to view your events."
            icon={undefined}
          />
          <div className="text-center mt-6">
            <Button onClick={() => setLoginOpen(true)}>Login</Button>
          </div>
        </div>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </PublicLayout>
    );
  }

  const userEventIds = getUserEventIds(currentUser.id);
  let userEvents = mockEvents.filter((event) => userEventIds.includes(event.id));

  // Sort events
  userEvents = [...userEvents].sort((a, b) => {
    if (sortBy === "rating") {
      const aRating = a.rating?.average ?? 0;
      const bRating = b.rating?.average ?? 0;
      return bRating - aRating;
    } else if (sortBy === "date") {
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    } else {
      // upcoming first
      const now = new Date().getTime();
      const aDate = new Date(a.eventDate).getTime();
      const bDate = new Date(b.eventDate).getTime();
      const aDiff = aDate - now;
      const bDiff = bDate - now;
      
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
            <p className="text-muted-foreground mt-1">
              Events you're registered for
            </p>
          </div>
          {userEvents.length > 0 && (
            <RatingSortDropdown value={sortBy} onChange={setSortBy} />
          )}
        </div>

        {userEvents.length > 0 ? (
          <EventListGrid events={userEvents} baseHref="/me/events" />
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
