import Link from "next/link";
import { Event } from "@/models/event";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCategoryLabel, getStatusLabel } from "@/lib/lookups";
import { formatDateShort } from "@/lib/format";
import { RatingBadge } from "./RatingBadge";
import { MapPin, Calendar } from "lucide-react";

type EventCardProps = {
  event: Event;
  href: string;
};

export function EventCard({ event, href }: EventCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer group">
        {/* Cover Image or Gradient */}
        <div className="h-48 w-full rounded-t-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-6xl font-bold text-primary/10">
              {event.title[0]}
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{getStatusLabel(event.statusId)}</Badge>
            <Badge variant="outline">{getCategoryLabel(event.categoryId)}</Badge>
          </div>
          <h3 className="text-xl font-semibold tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.shortDescription}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDateShort(event.eventDate)}</span>
            </div>
            {event.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.city}</span>
              </div>
            )}
          </div>

          {event.rating && (
            <div className="pt-2">
              <RatingBadge rating={event.rating} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
