"use client";

import Link from "next/link";
import { Event } from "@/models/event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel, getStatusLabel, getVisibilityLabel } from "@/lib/lookups";
import { formatDateShort } from "@/lib/format";
import { RatingBadge } from "../events/RatingBadge";

type AdminEventTableProps = {
  events: Event[];
};

export function AdminEventTable({ events }: AdminEventTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="font-medium hover:underline"
                >
                  {event.title}
                </Link>
              </TableCell>
              <TableCell>{formatDateShort(event.eventDate)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{getStatusLabel(event.statusId)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{getVisibilityLabel(event.visibilityId)}</Badge>
              </TableCell>
              <TableCell>{getCategoryLabel(event.categoryId)}</TableCell>
              <TableCell>
                {event.rating ? (
                  <RatingBadge rating={event.rating} />
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
