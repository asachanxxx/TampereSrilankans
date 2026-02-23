"use client";

import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventListGrid } from "@/components/events/EventListGrid";
import { CategoryFilterPills } from "@/components/events/CategoryFilterPills";
import { RatingSortDropdown, SortOption } from "@/components/events/RatingSortDropdown";
import { EmptyState } from "@/components/events/EmptyState";
import { Loader2 } from "lucide-react";
import type { Event } from "@/models/event";

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("upcoming");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(({ events }) => setAllEvents(events ?? []))
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allEvents
    .filter((e) => selectedCategory === "all" || e.categoryId === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating?.average ?? 0) - (a.rating?.average ?? 0);
      }
      if (sortBy === "date") {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
      // upcoming
      const now = Date.now();
      const aD = new Date(a.eventDate).getTime() - now;
      const bD = new Date(b.eventDate).getTime() - now;
      if (aD >= 0 && bD < 0) return -1;
      if (aD < 0 && bD >= 0) return 1;
      if (aD >= 0 && bD >= 0) return aD - bD;
      return bD - aD;
    });

  return (
    <PublicLayout>
      <section className="py-12">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-1">
              Discover upcoming events from the Sri Lankan Association in Tampere
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <CategoryFilterPills
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <RatingSortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            <EventListGrid events={filtered} />
          ) : (
            <EmptyState
              title="No events found"
              description="Try adjusting your filters to see more events."
            />
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
