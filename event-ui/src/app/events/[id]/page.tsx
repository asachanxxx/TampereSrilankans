"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventMetaRow } from "@/components/events/EventMetaRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/state/session";
import { CheckCircle, Loader2, TicketX } from "lucide-react";
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

  const isOngoing = event.statusId === "ongoing";
  const isUpcoming = event.statusId === "upcoming";
  const isTicketClosed = event.statusId === "ticket_closed";

  /** Render the registration action area for the sidebar/mobile card */
  const renderRegistrationContent = () => {
    // Logged-in user who is already registered
    if (currentUser && isRegistered) {
      return (
        <>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">You&apos;re registered for this event!</span>
          </div>
          <Button className="w-full" variant="outline" asChild>
            <Link href={`/me/events/${event.id}`}>View My Ticket</Link>
          </Button>
        </>
      );
    }

    // Event is upcoming — registration not open yet
    if (isUpcoming) {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Registration for this event is not yet open. Check back soon!
          </p>
          <Button className="w-full" variant="secondary" disabled>
            Registration Not Yet Open
          </Button>
        </>
      );
    }

    // Event is ticket_closed — no new registrations
    if (isTicketClosed) {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Ticketing for this event is now closed. No further registrations are accepted.
          </p>
          <Button className="w-full" variant="destructive" disabled>
            <TicketX className="mr-2 h-4 w-4" /> Ticketing Closed
          </Button>
        </>
      );
    }

    // Event is ongoing — show registration options
    if (isOngoing) {
      if (currentUser) {
        return (
          <>
            <p className="text-sm text-muted-foreground">
              Ready to join? Click below to register for this event.
            </p>
            <Button className="w-full" asChild>
              <Link href={`/events/${params.id}/register`}>Register Here</Link>
            </Button>
          </>
        );
      }
      // Unauthenticated — two options
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Sign in to register, or register without creating an account and receive your ticket by email.
          </p>
          <Button className="w-full" asChild>
            <Link href="/auth">Login to Register</Link>
          </Button>
          <Button className="w-full" variant="outline" asChild>
            <Link href={`/events/${params.id}/register?guest=true`}>Register without Sign in</Link>
          </Button>
        </>
      );
    }

    // Fallback (archive events should not reach this page via the public API)
    return null;
  };

  return (
    <PublicLayout>
      {/* Ticketing Closed Banner */}
      {isTicketClosed && (
        <div className="bg-destructive text-destructive-foreground">
          <div className="container mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <TicketX className="h-4 w-4" />
              <span>Ticketing for this event is now closed</span>
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

            {/* Registration Card - Mobile Only */}
            <div className="lg:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderRegistrationContent()}
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
                {renderRegistrationContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
