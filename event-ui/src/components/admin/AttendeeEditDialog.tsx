"use client";

import { useState } from "react";
import { Registration } from "@/models/registration";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type Props = {
  eventId: string;
  registration: Registration;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Registration) => void;
};

export function AttendeeEditDialog({ eventId, registration, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fullName: registration.fullName,
    email: registration.email,
    whatsappNumber: registration.whatsappNumber ?? "",
    spouseName: registration.spouseName ?? "",
    childrenUnder7Count: registration.childrenUnder7Count,
    childrenOver7Count: registration.childrenOver7Count,
    childrenNamesAndAges: registration.childrenNamesAndAges ?? "",
    vegetarianMealCount: registration.vegetarianMealCount,
    nonVegetarianMealCount: registration.nonVegetarianMealCount,
    otherPreferences: registration.otherPreferences ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendees/${registration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          whatsappNumber: form.whatsappNumber || undefined,
          spouseName: form.spouseName || undefined,
          childrenUnder7Count: Number(form.childrenUnder7Count),
          childrenOver7Count: Number(form.childrenOver7Count),
          childrenNamesAndAges: form.childrenNamesAndAges || undefined,
          vegetarianMealCount: Number(form.vegetarianMealCount),
          nonVegetarianMealCount: Number(form.nonVegetarianMealCount),
          otherPreferences: form.otherPreferences || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }
      const { registration: updated } = await res.json();
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Attendee</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Full Name</Label>
            <Input
              className="col-span-3"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Email</Label>
            <Input
              className="col-span-3"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">WhatsApp</Label>
            <Input
              className="col-span-3"
              value={form.whatsappNumber}
              onChange={(e) => handleChange("whatsappNumber", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Spouse</Label>
            <Input
              className="col-span-3"
              value={form.spouseName}
              onChange={(e) => handleChange("spouseName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Children &lt;7</Label>
            <Input
              className="col-span-3"
              type="number"
              min={0}
              value={form.childrenUnder7Count}
              onChange={(e) => handleChange("childrenUnder7Count", Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Children 7+</Label>
            <Input
              className="col-span-3"
              type="number"
              min={0}
              value={form.childrenOver7Count}
              onChange={(e) => handleChange("childrenOver7Count", Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Children Names</Label>
            <Textarea
              className="col-span-3"
              rows={3}
              value={form.childrenNamesAndAges}
              onChange={(e) => handleChange("childrenNamesAndAges", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Veg Meals</Label>
            <Input
              className="col-span-3"
              type="number"
              min={0}
              value={form.vegetarianMealCount}
              onChange={(e) => handleChange("vegetarianMealCount", Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Non-Veg Meals</Label>
            <Input
              className="col-span-3"
              type="number"
              min={0}
              value={form.nonVegetarianMealCount}
              onChange={(e) => handleChange("nonVegetarianMealCount", Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1 text-right text-xs">Preferences</Label>
            <Textarea
              className="col-span-3"
              rows={3}
              value={form.otherPreferences}
              onChange={(e) => handleChange("otherPreferences", e.target.value)}
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
