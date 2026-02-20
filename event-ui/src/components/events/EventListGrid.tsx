import { Event } from "@/models/event";
import { EventCard } from "./EventCard";

type EventListGridProps = {
  events: Event[];
  baseHref?: string;
};

export function EventListGrid({ events, baseHref = "/events" }: EventListGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} href={`${baseHref}/${event.id}`} />
      ))}
    </div>
  );
}
