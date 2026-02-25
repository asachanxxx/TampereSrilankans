"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Pencil,
} from "lucide-react";
import { formatDateShort } from "@/lib/format";
import type { Registration } from "@/models/registration";
import { AttendeeEditDialog } from "./AttendeeEditDialog";

interface Props {
  eventId: string;
  isAdmin: boolean;
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
      totalChildren: acc.totalChildren + r.childrenUnder7Count + r.childrenOver7Count,
    }),
    { total: 0, vegetarianMeals: 0, nonVegetarianMeals: 0, totalChildren: 0 }
  );
}

export function EventManagementAttendeesTab({ eventId, isAdmin }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Registration | null>(null);

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

  const handleSaved = (updated: Registration) => {
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {stats.total} attendees
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
          <Leaf className="h-3.5 w-3.5" />
          {stats.vegetarianMeals} veg
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-orange-700 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {stats.nonVegetarianMeals} non-veg
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
          <Baby className="h-3.5 w-3.5" />
          {stats.totalChildren} children
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search attendees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <UserX className="h-8 w-8 opacity-30" />
          <p className="text-sm">{search ? "No matches" : "No attendees yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => (
            <Card key={reg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">{reg.fullName}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {reg.email}
                      </span>
                      {reg.whatsappNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {reg.whatsappNumber}
                        </span>
                      )}
                      {reg.spouseName && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {reg.spouseName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDateShort(reg.registeredAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {reg.vegetarianMealCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
                          <Leaf className="h-2.5 w-2.5 mr-0.5" />
                          {reg.vegetarianMealCount} veg
                        </Badge>
                      )}
                      {reg.nonVegetarianMealCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-700 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
                          <UtensilsCrossed className="h-2.5 w-2.5 mr-0.5" />
                          {reg.nonVegetarianMealCount} non-veg
                        </Badge>
                      )}
                      {(reg.childrenUnder7Count > 0 || reg.childrenOver7Count > 0) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                          <Baby className="h-2.5 w-2.5 mr-0.5" />
                          {reg.childrenUnder7Count + reg.childrenOver7Count} children
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Admin edit button */}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setEditTarget(reg)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <AttendeeEditDialog
          eventId={eventId}
          registration={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
