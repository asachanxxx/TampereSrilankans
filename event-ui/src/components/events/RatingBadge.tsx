import { Star } from "lucide-react";
import { EventRating } from "@/models/event";

type RatingBadgeProps = {
  rating: EventRating;
  className?: string;
};

export function RatingBadge({ rating, className = "" }: RatingBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="font-medium">{rating.average.toFixed(1)}</span>
      <span className="text-muted-foreground">({rating.count})</span>
    </div>
  );
}
