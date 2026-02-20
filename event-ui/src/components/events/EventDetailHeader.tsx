import { Event } from "@/models/event";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel, getStatusLabel, getVisibilityLabel } from "@/lib/lookups";
import { RatingBadge } from "./RatingBadge";

type EventDetailHeaderProps = {
  event: Event;
};

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Cover Banner */}
      <div className="h-64 md:h-80 w-full rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-background overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-9xl font-bold text-primary/10">
              {event.title[0]}
            </span>
          </div>
        )}
      </div>

      {/* Title and Badges */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{getStatusLabel(event.statusId)}</Badge>
          <Badge variant="outline">{getCategoryLabel(event.categoryId)}</Badge>
          <Badge variant="outline">{getVisibilityLabel(event.visibilityId)}</Badge>
        </div>

        <h1 className="text-4xl font-bold tracking-tight">{event.title}</h1>
        
        {event.subtitle && (
          <p className="text-xl text-muted-foreground">{event.subtitle}</p>
        )}

        {event.rating && (
          <div className="pt-2">
            <RatingBadge rating={event.rating} />
          </div>
        )}
      </div>
    </div>
  );
}
