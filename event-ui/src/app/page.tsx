"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventListGrid } from "@/components/events/EventListGrid";
import { CategoryFilterPills } from "@/components/events/CategoryFilterPills";
import { RatingSortDropdown, SortOption } from "@/components/events/RatingSortDropdown";
import { EmptyState } from "@/components/events/EmptyState";
import { Event } from "@/models/event";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("upcoming");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(({ events }) => setAllEvents(events || []))
      .catch(() => setAllEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  // Filter events
  let filteredEvents = allEvents.filter((event) =>
    selectedCategory === "all" ? true : event.categoryId === selectedCategory
  );

  // Sort events
  filteredEvents = [...filteredEvents].sort((a, b) => {
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
      
      // Show upcoming events first (positive diff), then sort by proximity
      if (aDiff >= 0 && bDiff < 0) return -1;
      if (aDiff < 0 && bDiff >= 0) return 1;
      if (aDiff >= 0 && bDiff >= 0) return aDiff - bDiff;
      return bDiff - aDiff; // both past, show most recent first
    }
  });

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-background.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background"></div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto max-w-6xl px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find concerts, workshops, sports events, and community gatherings near you.
            Create unforgettable memories.
          </p>
          <Button size="lg" onClick={scrollToEvents}>
            Browse Events
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Organization Section */}
      <section id="about" className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                About Sri Lankan Association in Tampere
              </h2>
              <p className="text-muted-foreground mb-6">
                We're passionate about connecting people through exceptional experiences. 
                Our association makes it easy to discover, register for, and manage your event attendance.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Curated selection of quality events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Easy registration and ticket management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Support local organizers and communities</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video relative bg-gradient-to-br from-primary/20 to-primary/5">
              <img 
                src="/images/about-section.jpg" 
                alt="Sri Lankan Association in Tampere" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Events</h2>
            <RatingSortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          <div className="mb-6">
            <CategoryFilterPills
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length > 0 ? (
            <EventListGrid events={filteredEvents} />
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
