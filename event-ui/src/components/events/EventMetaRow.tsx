import { Calendar, Clock, MapPin, Building } from "lucide-react";
import { Event } from "@/models/event";
import { formatDate, formatTimeRange } from "@/lib/format";

type EventMetaRowProps = {
  event: Event;
};

export function EventMetaRow({ event }: EventMetaRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-y">
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="text-sm font-medium">Date</div>
          <div className="text-sm text-muted-foreground">
            {formatDate(event.eventDate)}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="text-sm font-medium">Time</div>
          <div className="text-sm text-muted-foreground">
            {formatTimeRange(event.startAt, event.endAt)}
          </div>
        </div>
      </div>

      {(event.locationName || event.city) && (
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="text-sm font-medium">Location</div>
            <div className="text-sm text-muted-foreground">
              {event.locationName}
              {event.locationName && event.city && <br />}
              {event.city}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="text-sm font-medium">Organizer</div>
          <div className="text-sm text-muted-foreground">
            {event.organizerName}
          </div>
        </div>
      </div>
    </div>
  );
}
