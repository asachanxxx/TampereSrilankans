"use client";

import { useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Event } from "@/models/event";
import { useSession } from "@/state/session";
import { toast } from "sonner";

type EventRegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSuccess: () => void;
};

export function EventRegistrationDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: EventRegistrationDialogProps) {
  const { currentUser } = useSession();
  const [name, setName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name || !email) {
      setError("Name and email are required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Mock loading
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Mock registration - in real app, this would call an API
    // For now, we'll just show success
    
    toast.success(`Successfully registered for ${event.title}!`, {
      description: "Check your email for confirmation details.",
    });

    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>
            Complete your registration for {event.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name *</Label>
            <Input
              id="reg-name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email *</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone">Phone (optional)</Label>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="+358 40 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>You'll receive a confirmation email</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Your ticket will be available in My Events</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Registering..." : "Complete Registration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
