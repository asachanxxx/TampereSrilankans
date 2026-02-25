"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { AdminEventSummaryCards } from "@/components/admin/AdminEventSummaryCards";
import { AdminEventAttendeesTab } from "@/components/admin/AdminEventAttendeesTab";
import { AdminEventTicketsTab } from "@/components/admin/AdminEventTicketsTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Event, EventStatusId } from "@/models/event";
import { allStatuses } from "@/lib/lookups";

const statusColors: Record<EventStatusId, string> = {
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ticket_closed: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  archive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<EventStatusId | "">("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setEvent(data.event);
          setSelectedStatus(data.event.statusId);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleStatusUpdate() {
    if (!event || !selectedStatus || selectedStatus === event.statusId) return;
    setStatusSaving(true);
    setStatusSaved(false);
    setStatusError("");

    try {
      const res = await fetch(`/api/events/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: selectedStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update status");
      setEvent((prev) => prev ? { ...prev, statusId: selectedStatus as EventStatusId } : prev);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 3000);
    } catch (err: any) {
      setStatusError(err.message || "Something went wrong");
    } finally {
      setStatusSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isDirty = selectedStatus !== event.statusId;

  return (
    <div className="space-y-6">
      <EventDetailHeader event={event} />

      <EventMetaRow event={event} />

      {/* Status Management Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Event Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[event.statusId]}`}>
                {allStatuses.find((s) => s.id === event.statusId)?.label ?? event.statusId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val as EventStatusId);
                  setStatusSaved(false);
                  setStatusError("");
                }}
                disabled={statusSaving}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Change statusâ€¦" />
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

              <Button
                size="sm"
                onClick={handleStatusUpdate}
                disabled={!isDirty || statusSaving}
              >
                {statusSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Savingâ€¦</>
                ) : (
                  "Update Status"
                )}
              </Button>

              {statusSaved && (
                <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {statusError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {allStatuses.map((s) => (
              <div key={s.id} className="rounded-md border px-3 py-2 text-xs">
                <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium mb-1 ${statusColors[s.id as EventStatusId]}`}>
                  {s.label}
                </span>
                <p className="text-muted-foreground leading-tight">
                  {s.id === "upcoming" && "Visible, registration not open"}
                  {s.id === "ongoing" && "Visible, registration open"}
                  {s.id === "ticket_closed" && "Visible, no new registrations"}
                  {s.id === "archive" && "Hidden from public"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AdminEventSummaryCards eventId={params.id} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Organizer</div>
              <div className="mt-1">{event.organizerName}</div>
            </div>
            {event.city && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">City</div>
                <div className="mt-1">{event.city}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendees" className="mt-6">
          <AdminEventAttendeesTab eventId={params.id} />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <AdminEventTicketsTab eventId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
