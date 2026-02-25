"use client";

import { useState } from "react";
import { Ticket } from "@/models/ticket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Props = {
  eventId: string;
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Ticket) => void;
};

export function TicketEditDialog({ eventId, ticket, open, onClose, onSaved }: Props) {
  const [issuedToName, setIssuedToName] = useState(ticket.issuedToName);
  const [issuedToEmail, setIssuedToEmail] = useState(ticket.issuedToEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuedToName, issuedToEmail }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }
      const { ticket: updated } = await res.json();
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Ticket number — read only */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Ticket #</Label>
            <Input
              className="col-span-3 font-mono text-xs bg-muted"
              readOnly
              value={ticket.ticketNumber}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Name</Label>
            <Input
              className="col-span-3"
              value={issuedToName}
              onChange={(e) => setIssuedToName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Email</Label>
            <Input
              className="col-span-3"
              type="email"
              value={issuedToEmail}
              onChange={(e) => setIssuedToEmail(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
