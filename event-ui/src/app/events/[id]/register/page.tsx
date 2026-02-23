"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "@/state/session";
import type { RegistrationFormData } from "@/models/registration";
import type { Event } from "@/models/event";

export default function EventRegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventNotFound, setEventNotFound] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    whatsappNumber: "+358 40 123 4567",
    spouseName: "Jane Doe",
    childrenUnder7Count: 1,
    childrenOver7Count: 1,
    childrenNamesAndAges: "Amal (3), Nimal (9)",
    vegetarianMealCount: 2,
    nonVegetarianMealCount: 1,
    otherPreferences: "No nuts",
    consentToStorePersonalData: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

    if (!formData.consentToStorePersonalData) {
      setError("You must consent to storing your personal data to register.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id, ...formData }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">You're registered!</h1>
          <p className="text-muted-foreground">
            Your registration for <span className="font-medium text-foreground">{event.title}</span> was
            successful. A ticket has been generated and is available in My Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={`/me/events/${event.id}`}>View My Ticket</Link>
            </Button>
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
        {/* Back link */}
        <Link
          href={`/events/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {event.title}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Event Registration</CardTitle>
            <CardDescription>
              Complete the form below to register for{" "}
              <span className="font-medium text-foreground">{event.title}</span>
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
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setField("whatsappNumber", e.target.value)}
                    placeholder="+358 40 123 4567"
                    disabled={loading}
                  />
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
                    <Label htmlFor="childrenUnder7">Children Under 7</Label>
                    <Input
                      id="childrenUnder7"
                      type="number"
                      min={0}
                      value={formData.childrenUnder7Count}
                      onChange={(e) => setField("childrenUnder7Count", parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childrenOver7">Children Over 7</Label>
                    <Input
                      id="childrenOver7"
                      type="number"
                      min={0}
                      value={formData.childrenOver7Count}
                      onChange={(e) => setField("childrenOver7Count", parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childrenNamesAndAges">Children Names &amp; Ages</Label>
                  <Textarea
                    id="childrenNamesAndAges"
                    value={formData.childrenNamesAndAges}
                    onChange={(e) => setField("childrenNamesAndAges", e.target.value)}
                    placeholder="e.g. Amal (4), Nimal (9)"
                    rows={2}
                    disabled={loading}
                  />
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
                    <Label htmlFor="vegetarianMeals">Vegetarian Meals</Label>
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
                    <Label htmlFor="nonVegetarianMeals">Non-Vegetarian Meals</Label>
                    <Input
                      id="nonVegetarianMeals"
                      type="number"
                      min={0}
                      value={formData.nonVegetarianMealCount}
                      onChange={(e) => setField("nonVegetarianMealCount", parseInt(e.target.value) || 0)}
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

