"use client";

import { useState } from "react";
import { Ticket, TicketStage, deriveTicketStage } from "@/models/ticket";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES: { stage: TicketStage; label: string; color: string }[] = [
  { stage: "new", label: "New", color: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200" },
  { stage: "assigned", label: "Assigned", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { stage: "payment_sent", label: "Payment Sent", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { stage: "paid", label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { stage: "boarded", label: "Boarded", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
];

type Props = {
  eventId: string;
  ticket: Ticket;
  onUpdated?: (ticket: Ticket) => void;
  disabled?: boolean;
};

export function TicketStatusControl({ eventId, ticket, onUpdated, disabled }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentStage = deriveTicketStage(ticket);

  const handleStageClick = async (targetStage: TicketStage) => {
    if (targetStage === currentStage || saving || disabled) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStage }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Stage update failed");
      }
      const { ticket: updated } = await res.json();
      onUpdated?.(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {STAGES.map(({ stage, label, color }) => {
          const isActive = stage === currentStage;
          return (
            <button
              key={stage}
              type="button"
              disabled={saving || disabled}
              onClick={() => handleStageClick(stage)}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium border transition-all",
                isActive
                  ? cn(color, "ring-2 ring-offset-1 ring-foreground/20 scale-105")
                  : "opacity-50 hover:opacity-80 bg-muted text-muted-foreground border-border"
              )}
            >
              {label}
            </button>
          );
        })}
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
