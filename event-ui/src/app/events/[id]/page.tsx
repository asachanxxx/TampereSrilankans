"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/state/session";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Event } from "@/models/event";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { currentUser, authStatus } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then(({ event: fetchedEvent }) => setEvent(fetchedEvent ?? null))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch(`/api/registrations?eventId=${params.id}`)
      .then((r) => r.json())
      .then(({ isRegistered }) => setIsRegistered(!!isRegistered))
      .catch(() => {});
  }, [authStatus, params.id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-6xl px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (!event) {
    notFound();
  }

  // Registration button configuration
  const getRegistrationButtonConfig = () => {
    if (!event.registrationEnabled) {
      return {
        text: "Registration Unavailable",
        variant: "secondary" as const,
        disabled: true,
      };
    }

    if (!currentUser) {
      return {
        text: "Login to Register",
        variant: "default" as const,
        disabled: false,
        href: "/auth",
      };
    }

    if (isRegistered) {
      return {
        text: "Registered ✓",
        variant: "secondary" as const,
        disabled: true,
      };
    }

    switch (event.registrationStatus) {
      case "on":
        return {
          text: "Register Here",
          variant: "default" as const,
          disabled: false,
          href: `/events/${params.id}/register`,
        };
      case "soon":
        return {
          text: "Registration Opens Soon",
          variant: "secondary" as const,
          disabled: true,
        };
      case "close":
        return {
          text: "Registration Closed",
          variant: "destructive" as const,
          disabled: true,
        };
      default:
        return {
          text: "Register",
          variant: "default" as const,
          disabled: false,
        };
    }
  };

  const buttonConfig = getRegistrationButtonConfig();

  return (
    <PublicLayout>
      {/* Registration Closed Banner */}
      {event.registrationEnabled && event.registrationStatus === "close" && (
        <div className="bg-destructive text-destructive-foreground">
          <div className="container mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Registration for this event is now closed</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <EventDetailHeader event={event} />
            
            <EventMetaRow event={event} />

            {/* Registration Card - Mobile Only (shows below rating) */}
            <div className="lg:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentUser ? (
                    <>
                      {isRegistered ? (
                        <>
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">You're registered for this event!</span>
                          </div>
                          <Button
                            className="w-full"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/me/events/${event.id}`}>View My Ticket</Link>
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {event.registrationStatus === "on"
                              ? "Ready to join? Click below to register for this event."
                              : event.registrationStatus === "soon"
                              ? "Registration will open soon. Check back later!"
                              : "Registration for this event has closed."}
                          </p>
                          {buttonConfig.href ? (
                            <Button className="w-full" variant={buttonConfig.variant} asChild>
                              <Link href={buttonConfig.href}>{buttonConfig.text}</Link>
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              variant={buttonConfig.variant}
                              disabled={buttonConfig.disabled}
                            >
                              {buttonConfig.text}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Please login to register for this event and view your tickets.
                      </p>
                      <Button
                        className="w-full"
                        asChild
                      >
                        <Link href="/auth">Login to Register</Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                {event.aboutSectionTitle || "About This Event"}
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser ? (
                  <>
                    {isRegistered ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">You're registered for this event!</span>
                        </div>
                        <Button
                          className="w-full"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/me/events/${event.id}`}>View My Ticket</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {event.registrationStatus === "on"
                            ? "Ready to join? Click below to register for this event."
                            : event.registrationStatus === "soon"
                            ? "Registration will open soon. Check back later!"
                            : "Registration for this event has closed."}
                        </p>
                        {buttonConfig.href ? (
                          <Button className="w-full" variant={buttonConfig.variant} asChild>
                            <Link href={buttonConfig.href}>{buttonConfig.text}</Link>
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant={buttonConfig.variant}
                            disabled={buttonConfig.disabled}
                          >
                            {buttonConfig.text}
                          </Button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Please login to register for this event and view your tickets.
                    </p>
                    <Button
                      className="w-full"
                      asChild
                    >
                      <Link href="/auth">Login to Register</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </PublicLayout>
  );
}
