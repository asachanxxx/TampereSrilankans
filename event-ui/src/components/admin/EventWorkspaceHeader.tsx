"use client";

import { Event } from "@/models/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, FileText, Utensils, Baby } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  event: Event;
  isAdmin?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ticket_closed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: "Ongoing",
  ticket_closed: "Ticket Closed",
};

export function EventWorkspaceHeader({ event, isAdmin }: Props) {
  const openReport = (type: string) => {
    window.open(`/admin/reports/${event.id}/${type}`, "_blank");
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Left: event info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-semibold text-sm truncate">{event.title}</h1>
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", STATUS_COLORS[event.statusId])}
              >
                {STATUS_LABELS[event.statusId] ?? event.statusId}
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              {event.eventDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDateShort(event.eventDate)}
                </span>
              )}
              {event.locationName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {event.locationName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: report buttons (admin only) */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReport("attendees")}>
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attendees</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReport("meals")}>
              <Utensils className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Meals</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReport("children")}>
              <Baby className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Children's</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
