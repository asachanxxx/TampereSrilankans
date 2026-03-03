"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Loader2, Ticket, Trash2, PlusCircle } from "lucide-react";
import { TicketQRCode } from "@/components/events/TicketQRCode";
import { useSession } from "@/state/session";
import type { RegistrationFormData, RegistrationChild } from "@/models/registration";
import type { Event } from "@/models/event";

export default function EventRegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get("guest") === "true";

  const { currentUser } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventNotFound, setEventNotFound] = useState(false);
  const [childrenAgeThreshold, setChildrenAgeThreshold] = useState(7);
  const [ticketBaseUrl, setTicketBaseUrl] = useState("");

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    whatsappNumber: "",
    spouseName: "",
    childrenUnder7Count: 0,
    childrenOver7Count: 0,
    children: [],
    vegetarianMealCount: 0,
    nonVegetarianMealCount: 0,
    kidsMealCount: 0,
    otherPreferences: "",
    consentToStorePersonalData: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSaveMessage, setTicketSaveMessage] = useState("Save your ticket number — you will need it when boarding the event.");

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(({ event: fetchedEvent }) => {
        if (!fetchedEvent) setEventNotFound(true);
        else setEvent(fetchedEvent);
      })
      .catch(() => setEventNotFound(true))
      .finally(() => setEventLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((config) => {
        const threshold = parseInt(config.children_age_threshold);
        if (!isNaN(threshold)) setChildrenAgeThreshold(threshold);
        if (config.ticket_base_url) setTicketBaseUrl(config.ticket_base_url);
        if (config.ticket_save_message) setTicketSaveMessage(config.ticket_save_message);
      })
      .catch(() => {/* use defaults */});
  }, []);

  // Keep form in sync when user profile loads
  useEffect(() => {
    if (!isGuest && currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.displayName || "",
        email: prev.email || currentUser.email || "",
      }));
    }
  }, [currentUser, isGuest]);

  if (eventLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-xl px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (eventNotFound || !event) {
    notFound();
  }

  const setField = <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || formData.fullName.trim().length === 0) {
      setError("Full name is required.");
      return;
    }

    if (isGuest && !formData.email) {
      setError("Please provide your email address so we can send your ticket.");
      return;
    }

    if (!formData.whatsappNumber) {
      setError("WhatsApp number is required.");
      return;
    }
    const whatsappPattern = /^\+358\d{6,12}$|^\+94\d{7,12}$/;
    const whatsappCleaned = formData.whatsappNumber.replace(/\s/g, "");
    if (!whatsappPattern.test(whatsappCleaned)) {
      setError("WhatsApp number must start with +358 (Finnish) or +94 (Sri Lankan).");
      return;
    }

    if (!formData.consentToStorePersonalData) {
      setError("You must consent to storing your personal data to register.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          guest: isGuest,
          ...formData,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      if (json.ticketNumber) {
        setTicketNumber(json.ticketNumber);
        setShowTicketModal(true);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const ticketUrl = ticketNumber ? `/tickets/${ticketNumber}` : null;
    const ticketFullUrl = ticketNumber
      ? `${ticketBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/tickets/${ticketNumber}`
      : null;

    return (
      <PublicLayout>
        {/* Ticket details modal — blocked from closing on outside click or ESC */}
        <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
          <DialogContent
            className="max-w-md max-h-[90vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Registration Successful!
              </DialogTitle>
              <DialogDescription>
                Your registration for <strong>{event!.title}</strong> is confirmed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {ticketNumber && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Ticket className="h-4 w-4" />
                    Your Ticket
                  </div>

                  {/* QR Code — same JSON format as ticket page for boarding scan */}
                  {ticketNumber && (
                    <div className="flex flex-col items-center gap-1 py-2">
                      <TicketQRCode ticketNumber={ticketNumber} eventId={params.id} size={160} />
                      <p className="text-xs text-muted-foreground">Show this QR code at the event entrance</p>
                      <p className="text-xs text-muted-foreground">Take a screenshot to save</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ticket Number</p>
                    <p className="font-mono text-base font-bold tracking-widest">{ticketNumber}</p>
                  </div>

                  {/* Configurable save reminder */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-xs text-amber-800 font-medium">{ticketSaveMessage}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Issued To</p>
                    <p className="text-sm">{formData.fullName}</p>
                    <p className="text-sm text-muted-foreground">{formData.email}</p>
                  </div>
                  {ticketUrl && (
                    <Button asChild className="w-full" size="sm">
                      <Link href={ticketUrl} target="_blank">Open Ticket Page</Link>
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {!isGuest && (
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/me/events/${event!.id}`}>My Events</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/events/${params.id}`}>Back to Event</Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re registered!</h1>
          <p className="text-muted-foreground">
            Your registration for <span className="font-medium text-foreground">{event!.title}</span> was successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {ticketUrl && (
              <Button asChild>
                <Link href={ticketUrl}>View My Ticket</Link>
              </Button>
            )}
            {!isGuest && (
              <Button variant="outline" asChild>
                <Link href={`/me/events/${event!.id}`}>My Events</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/events/${params.id}`}>Back to Event</Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {event.coverImageUrl && (
          <div className="w-full rounded-xl overflow-hidden mb-6 max-h-48">
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{event?.title} Registration</CardTitle>
            <CardDescription>
              {isGuest ? (
                <>Register without an account for{" "}
                  <span className="font-medium text-foreground">{event.title}</span>.
                </>
              ) : (
                <>Complete the form below to register for{" "}
                  <span className="font-medium text-foreground">{event.title}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isGuest && (
                <Alert>
                  <Ticket className="h-4 w-4" />
                  <AlertDescription>
                    After registration you will receive a <strong>ticket number</strong>. Save it — your ticket is accessible anytime at{" "}
                    <span className="font-mono text-xs break-all">{ticketBaseUrl}/tickets/[your-ticket-number]</span>.
                  </AlertDescription>
                </Alert>
              )}

              {/* Personal Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Personal Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="John Doe"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                      {isGuest && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(ticket sent here)</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={isGuest ? (e) => setField("email", e.target.value) : undefined}
                      disabled={!isGuest || loading}
                      className={!isGuest ? "bg-muted cursor-not-allowed" : ""}
                      placeholder={isGuest ? "your@email.com" : undefined}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setField("whatsappNumber", e.target.value)}
                    placeholder="+358 40 123 4567 or +94 77 123 4567"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must start with +358 (Finland) or +94 (Sri Lanka)</p>
                </div>
              </section>

              <Separator />

              {/* Family Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Family Details
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="spouseName">Spouse / Partner Name</Label>
                  <Input
                    id="spouseName"
                    value={formData.spouseName}
                    onChange={(e) => setField("spouseName", e.target.value)}
                    placeholder="Jane Doe"
                    disabled={loading}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childrenUnder7">Children Under {childrenAgeThreshold}</Label>
                    <Input
                      id="childrenUnder7"
                      type="number"
                      value={formData.childrenUnder7Count}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childrenOver7">Children {childrenAgeThreshold}+</Label>
                    <Input
                      id="childrenOver7"
                      type="number"
                      value={formData.childrenOver7Count}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Dynamic children detail rows */}
                <div className="space-y-3">
                  {(formData.children ?? []).length > 0 && (
                    <>
                      <Label>Children Names &amp; Ages</Label>
                      {(formData.children ?? []).map((child, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Child ${idx + 1} name`}
                          value={child.childName}
                          onChange={(e) => {
                            const updated = [...(formData.children ?? [])];
                            updated[idx] = { ...updated[idx], childName: e.target.value };
                            setField("children", updated);
                          }}
                          disabled={loading}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Age"
                          min={0}
                          max={18}
                          value={child.childAge || ""}
                          onChange={(e) => {
                            const updated = [...(formData.children ?? [])];
                            updated[idx] = { ...updated[idx], childAge: parseInt(e.target.value) || 0 };
                            setField("children", updated);
                          }}
                          disabled={loading}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={loading}
                          onClick={() => {
                            const updated = (formData.children ?? []).filter((_, i) => i !== idx);
                            const isOver = child.childAge >= childrenAgeThreshold;
                            setFormData((prev) => ({
                              ...prev,
                              children: updated,
                              childrenUnder7Count: isOver ? (prev.childrenUnder7Count ?? 0) : Math.max(0, (prev.childrenUnder7Count ?? 0) - 1),
                              childrenOver7Count: isOver ? Math.max(0, (prev.childrenOver7Count ?? 0) - 1) : (prev.childrenOver7Count ?? 0),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    </>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            children: [...(prev.children ?? []), { childName: "", childAge: 0 }],
                            childrenUnder7Count: (prev.childrenUnder7Count ?? 0) + 1,
                          }));
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Child Under {childrenAgeThreshold}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            children: [...(prev.children ?? []), { childName: "", childAge: childrenAgeThreshold }],
                            childrenOver7Count: (prev.childrenOver7Count ?? 0) + 1,
                          }));
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Child {childrenAgeThreshold}+
                      </Button>
                    </div>
                </div>
              </section>

              <Separator />

              {/* Meal Preferences */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Meal Preferences
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vegetarianMeals">No Of Vegetarian Meals</Label>
                    <Input
                      id="vegetarianMeals"
                      type="number"
                      min={0}
                      value={formData.vegetarianMealCount}
                      onChange={(e) => setField("vegetarianMealCount", parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonVegetarianMeals">No Of Non-Vegetarian Meals</Label>
                    <Input
                      id="nonVegetarianMeals"
                      type="number"
                      min={0}
                      value={formData.nonVegetarianMealCount}
                      onChange={(e) => setField("nonVegetarianMealCount", parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kidsMeals">No Of Kid's Meals</Label>
                    <Input
                      id="kidsMeals"
                      type="number"
                      min={0}
                      value={formData.kidsMealCount}
                      onChange={(e) => setField("kidsMealCount", parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherPreferences">Other Dietary Preferences / Allergies</Label>
                  <Textarea
                    id="otherPreferences"
                    value={formData.otherPreferences}
                    onChange={(e) => setField("otherPreferences", e.target.value)}
                    placeholder="e.g. Nut allergy, Gluten-free, Halal..."
                    rows={2}
                    disabled={loading}
                  />
                </div>
              </section>

              <Separator />

              {/* Consent */}
              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={formData.consentToStorePersonalData}
                    onCheckedChange={(checked) =>
                      setField("consentToStorePersonalData", checked === true)
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="consent" className="leading-relaxed cursor-pointer">
                    I consent to the Tampere Sri Lankans association storing my personal data provided
                    in this form for the purpose of event management. This data will not be shared
                    with third parties. <span className="text-destructive">*</span>
                  </Label>
                </div>
              </section>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Submitting..." : "Complete Registration"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
