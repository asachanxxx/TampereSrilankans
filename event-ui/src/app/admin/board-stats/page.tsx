"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";

type EventItem = { id: string; title: string; statusId: string; eventDate: string | null };

type Stats = {
  summary: {
    total: number;
    boarded: number;
    pendingArrival: number;
    awaitingPayment: number;
    completionPct: number;
  };
  meals: { vegMeals: number; nonVegMeals: number; kidsMeals: number };
  recentCheckIns: { ticketNumber: string; name: string; boardedAt: string }[];
  pendingArrival: { ticketNumber: string; name: string }[];
};

export default function BoardStatsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Load event list on mount
  useEffect(() => {
    fetch("/api/admin/board-stats")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events ?? []);
        if (data.events?.length === 1) setSelectedEventId(data.events[0].id);
      })
      .catch(() => setError("Failed to load events"))
      .finally(() => setEventsLoading(false));
  }, []);

  const loadStats = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/board-stats?eventId=${eventId}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setStats(await res.json());
      setLastRefreshed(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats when event selected
  useEffect(() => {
    if (selectedEventId) loadStats(selectedEventId);
  }, [selectedEventId, loadStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!selectedEventId) return;
    const interval = setInterval(() => loadStats(selectedEventId), 30_000);
    return () => clearInterval(interval);
  }, [selectedEventId, loadStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6" />
            Board Statistics
          </h1>
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastRefreshed.toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!selectedEventId || loading}
          onClick={() => loadStats(selectedEventId)}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Event selector */}
      <div className="max-w-sm">
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading events...
          </div>
        ) : (
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event…" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading statistics…
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Checked In
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.summary.boarded}</p>
                <p className="text-xs text-muted-foreground mt-0.5">of {stats.summary.total} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Pending Arrival
                </div>
                <p className="text-3xl font-bold text-amber-600">{stats.summary.pendingArrival}</p>
                <p className="text-xs text-muted-foreground mt-0.5">paid, not yet arrived</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  Awaiting Payment
                </div>
                <p className="text-3xl font-bold text-red-500">{stats.summary.awaitingPayment}</p>
                <p className="text-xs text-muted-foreground mt-0.5">not yet paid</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Completion
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.summary.completionPct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">boarded / total</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Boarding Progress</p>
                <p className="text-sm text-muted-foreground">
                  {stats.summary.boarded} / {stats.summary.total}
                </p>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${stats.summary.completionPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {stats.summary.pendingArrival > 0 && (
                  <span className="text-amber-600">{stats.summary.pendingArrival} paid &amp; on their way · </span>
                )}
                {stats.summary.awaitingPayment > 0 && (
                  <span className="text-red-500">{stats.summary.awaitingPayment} awaiting payment</span>
                )}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent check-ins */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Recent Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentCheckIns.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">No check-ins yet</p>
                ) : (
                  <div className="divide-y">
                    {stats.recentCheckIns.map((item) => (
                      <div key={item.ticketNumber} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{item.ticketNumber}</p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(item.boardedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending arrival */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Still to Arrive
                  {stats.pendingArrival.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {stats.pendingArrival.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.pendingArrival.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    {stats.summary.boarded === stats.summary.total && stats.summary.total > 0
                      ? "🎉 Everyone has checked in!"
                      : "No paid tickets pending arrival"}
                  </p>
                ) : (
                  <div className="divide-y max-h-72 overflow-y-auto">
                    {stats.pendingArrival.map((item) => (
                      <div key={item.ticketNumber} className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{item.ticketNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!selectedEventId && !eventsLoading && events.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No active events found. Events with status <em>upcoming</em>, <em>ongoing</em>, or <em>ticket closed</em> will appear here.
        </div>
      )}
    </div>
  );
}
