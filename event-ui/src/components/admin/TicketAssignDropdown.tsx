"use client";

import { useEffect, useState } from "react";
import { AppUser } from "@/models/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type Props = {
  ticketId: string;
  currentAssignedId: string | null;
  onAssigned?: (ticket: any) => void;
  disabled?: boolean;
};

export function TicketAssignDropdown({ ticketId, currentAssignedId, onAssigned, disabled }: Props) {
  const [staff, setStaff] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then(({ staff: s }) => setStaff(s ?? []))
      .catch(() => setError("Failed to load staff"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (value: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: value === "__none__" ? null : value }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Assignment failed");
      }
      const { ticket } = await res.json();
      onAssigned?.(ticket);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (error) return <p className="text-xs text-destructive">{error}</p>;

  return (
    <Select
      value={currentAssignedId ?? "__none__"}
      onValueChange={handleChange}
      disabled={disabled || saving}
    >
      <SelectTrigger className="h-8 text-xs w-44">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— Unassigned —</SelectItem>
        {staff.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.displayName}
            <span className="ml-1 text-muted-foreground capitalize text-[10px]">({s.role})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
