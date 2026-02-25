"use client";

import { useEffect, useState } from "react";
import { Event } from "@/models/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Loader2, RefreshCw } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  onSelect: (event: Event) => void;
};

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ticket_closed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: "Ongoing",
  ticket_closed: "Ticket Closed",
};

export function EventManagementPicker({ onSelect }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events/active");
      if (!res.ok) throw new Error("Failed to load events");
      const { events: evts } = await res.json();
      setEvents(evts ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 h-40 justify-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No ongoing or recently closed events found.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select an Event to Manage</h2>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
            className={cn(
              "text-left rounded-xl border p-5 transition-all hover:border-primary hover:shadow-sm",
              "bg-card hover:bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-2">{event.title}</h3>
              <Badge
                variant="outline"
                className={cn("shrink-0 text-xs", STATUS_COLORS[event.statusId])}
              >
                {STATUS_LABELS[event.statusId] ?? event.statusId}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {event.eventDate
                    ? formatDateShort(event.eventDate)
                    : "Date TBC"}
                </span>
              </div>
              {event.locationName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{event.locationName}{event.city ? `, ${event.city}` : ""}</span>
                </div>
              )}
            </div>

            {event.shortDescription && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {event.shortDescription}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
