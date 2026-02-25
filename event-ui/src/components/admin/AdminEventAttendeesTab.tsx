"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  Leaf,
  UtensilsCrossed,
  Baby,
  Phone,
  Mail,
  Heart,
  CalendarDays,
  UserX,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import type { Registration } from "@/models/registration";

interface Props {
  eventId: string;
}

interface Stats {
  total: number;
  vegetarianMeals: number;
  nonVegetarianMeals: number;
  totalChildren: number;
}

function computeStats(registrations: Registration[]): Stats {
  return registrations.reduce(
    (acc, r) => ({
      total: acc.total + 1,
      vegetarianMeals: acc.vegetarianMeals + r.vegetarianMealCount,
      nonVegetarianMeals: acc.nonVegetarianMeals + r.nonVegetarianMealCount,
      totalChildren:
        acc.totalChildren + r.childrenUnder7Count + r.childrenOver7Count,
    }),
    { total: 0, vegetarianMeals: 0, nonVegetarianMeals: 0, totalChildren: 0 }
  );
}

export function AdminEventAttendeesTab({ eventId }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/events/${eventId}/attendees`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRegistrations(data.registrations ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return registrations;
    return registrations.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.whatsappNumber ?? "").toLowerCase().includes(q)
    );
  }, [registrations, search]);

  const stats = useMemo(() => computeStats(registrations), [registrations]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          icon={<Users className="h-4 w-4" />}
          label="Registrations"
          value={stats.total}
          color="blue"
        />
        <StatPill
          icon={<Leaf className="h-4 w-4" />}
          label="Vegetarian"
          value={stats.vegetarianMeals}
          color="green"
        />
        <StatPill
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label="Non-Veg"
          value={stats.nonVegetarianMeals}
          color="amber"
        />
        <StatPill
          icon={<Baby className="h-4 w-4" />}
          label="Children"
          value={stats.totalChildren}
          color="purple"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by name, email or WhatsApp…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Result count */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {registrations.length} results
        </p>
      )}

      {/* Attendee cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <UserX className="h-10 w-10" />
          <p className="text-sm">
            {search ? "No attendees match your search." : "No registrations yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <AttendeeCard key={r.id} registration={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    green:
      "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    purple:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${colors[color]}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        <div className="text-xs opacity-75">{label}</div>
      </div>
    </div>
  );
}

function AttendeeCard({ registration: r }: { registration: Registration }) {
  const isGuest = !r.userId;
  const totalChildren = r.childrenUnder7Count + r.childrenOver7Count;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left accent bar */}
          <div
            className={`w-full sm:w-1.5 shrink-0 ${
              isGuest ? "bg-amber-400" : "bg-blue-500"
            }`}
          />

          <div className="flex-1 px-4 py-3 space-y-2">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm">{r.fullName}</span>
              <Badge
                variant="outline"
                className={
                  isGuest
                    ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700"
                    : "text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700"
                }
              >
                {isGuest ? "Guest" : "Member"}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateShort(r.registeredAt)}
              </span>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {r.email}
              </span>
              {r.whatsappNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {r.whatsappNumber}
                </span>
              )}
              {r.spouseName && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {r.spouseName}
                </span>
              )}
            </div>

            {/* Meal & children row */}
            <div className="flex flex-wrap gap-2 text-xs">
              {r.vegetarianMealCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5">
                  <Leaf className="h-3 w-3" />
                  {r.vegetarianMealCount} vegetarian
                </span>
              )}
              {r.nonVegetarianMealCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5">
                  <UtensilsCrossed className="h-3 w-3" />
                  {r.nonVegetarianMealCount} non-veg
                </span>
              )}
              {totalChildren > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5">
                  <Baby className="h-3 w-3" />
                  {r.childrenUnder7Count > 0 && `${r.childrenUnder7Count} under 7`}
                  {r.childrenUnder7Count > 0 && r.childrenOver7Count > 0 && " · "}
                  {r.childrenOver7Count > 0 && `${r.childrenOver7Count} over 7`}
                </span>
              )}
            </div>

            {/* Children names */}
            {r.childrenNamesAndAges && (
              <p className="text-xs text-muted-foreground italic">{r.childrenNamesAndAges}</p>
            )}

            {/* Other preferences */}
            {r.otherPreferences && (
              <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1">
                {r.otherPreferences}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
