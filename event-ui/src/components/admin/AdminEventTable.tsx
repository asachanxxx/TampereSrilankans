"use client";

import { useState } from "react";
import Link from "next/link";
import { Event, EventStatusId } from "@/models/event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { allStatuses, getCategoryLabel, getVisibilityLabel } from "@/lib/lookups";
import { formatDateShort } from "@/lib/format";
import { RatingBadge } from "../events/RatingBadge";
import { Loader2, CheckCircle2 } from "lucide-react";

type AdminEventTableProps = {
  events: Event[];
};

const statusColors: Record<EventStatusId, string> = {
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ticket_closed: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  archive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function AdminEventTable({ events: initialEvents }: AdminEventTableProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleStatusChange(eventId: string, newStatus: EventStatusId) {
    setSaving((prev) => new Set(prev).add(eventId));
    setErrors((prev) => { const n = { ...prev }; delete n[eventId]; return n; });

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: newStatus }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update status");
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, statusId: newStatus } : e))
      );
      setSaved((prev) => new Set(prev).add(eventId));
      setTimeout(() => setSaved((prev) => { const n = new Set(prev); n.delete(eventId); return n; }), 2000);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [eventId]: err.message }));
    } finally {
      setSaving((prev) => { const n = new Set(prev); n.delete(eventId); return n; });
    }
  }

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
            <TableRow key={event.id}>
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
                <div className="flex items-center gap-2">
                  <Select
                    value={event.statusId}
                    onValueChange={(val) => handleStatusChange(event.id, val as EventStatusId)}
                    disabled={saving.has(event.id)}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.statusId]}`}>
                          {allStatuses.find((s) => s.id === event.statusId)?.label ?? event.statusId}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.id as EventStatusId]}`}>
                            {s.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {saving.has(event.id) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {saved.has(event.id) && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                  {errors[event.id] && (
                    <span className="text-xs text-destructive">{errors[event.id]}</span>
                  )}
                </div>
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
