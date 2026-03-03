"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  ScanLine,
  Ticket,
  XCircle,
  UserCheck,
} from "lucide-react";
import type { Ticket as TicketType } from "@/models/ticket";

type ScanResult = {
  ticket: TicketType;
  event: {
    title: string;
    event_date: string;
    location_name: string;
    city: string;
  } | null;
};

export default function CheckInPage() {
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [boardedSuccess, setBoardedSuccess] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const lookupTicket = async (ticketNumber: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets?ticketNumber=${encodeURIComponent(ticketNumber)}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Ticket not found");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to look up ticket");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setError("");
    setResult(null);
    setBoardedSuccess(false);

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Handles JSON format: {ticketNumber, eventId, timestamp}
          // Also handles raw "EVT-XXXXXXXX" or URL as fallback
          let ticketNumber: string;
          try {
            const parsed = JSON.parse(decodedText);
            ticketNumber = parsed.ticketNumber ?? decodedText.trim();
          } catch {
            const match = decodedText.match(/EVT-[A-F0-9]{8}/i);
            ticketNumber = match ? match[0].toUpperCase() : decodedText.trim();
          }

          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          await lookupTicket(ticketNumber);
        },
        () => {} // ignore per-frame decode errors
      );
      setScanning(true);
    } catch {
      setError("Could not access camera. Please allow camera permission and try again.");
    }
  };

  const markBoarded = async () => {
    if (!result) return;
    setBoarding(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${result.ticket.id}/board`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to mark as boarded");
      }
      const { ticket } = await res.json();
      setResult((prev) => (prev ? { ...prev, ticket } : null));
      setBoardedSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBoarding(false);
    }
  };

  const scanNext = () => {
    setResult(null);
    setError("");
    setBoardedSuccess(false);
    startScanner();
  };

  // Cleanup on unmount
  useEffect(() => () => { stopScanner(); }, []);

  const ticket = result?.ticket;
  const event = result?.event;

  const getPaymentBadge = () => {
    if (!ticket) return null;
    if (ticket.paymentStatus === "paid")
      return <Badge className="bg-green-600 text-white">Paid</Badge>;
    if (ticket.paymentStatus === "payment_sent")
      return <Badge variant="secondary">Payment Sent</Badge>;
    return <Badge variant="destructive">Unpaid</Badge>;
  };

  const getBoardingBadge = () => {
    if (!ticket) return null;
    if (ticket.boardingStatus === "boarded")
      return <Badge className="bg-blue-600 text-white">Boarded ✓</Badge>;
    return <Badge variant="outline">Not Boarded</Badge>;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          Event Check-in
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan attendee QR codes to verify tickets and record boarding.
        </p>
      </div>

      {/* Camera / Scanner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">QR Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
          {!scanning ? (
            <Button onClick={startScanner} className="w-full" disabled={loading}>
              <ScanLine className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanner} className="w-full">
              Stop Scanner
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Looking up ticket...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Boarded success banner */}
      {boardedSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Attendee successfully boarded!
        </div>
      )}

      {/* Ticket result card */}
      {ticket && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Ticket Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Ticket Number</p>
                <p className="font-mono font-bold">{ticket.ticketNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issued To</p>
                <p className="font-medium">{ticket.issuedToName}</p>
                <p className="text-xs text-muted-foreground">{ticket.issuedToEmail}</p>
              </div>
              {event && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Event</p>
                  <p className="font-medium">{event.title}</p>
                  {event.event_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  )}
                  {event.location_name && (
                    <p className="text-xs text-muted-foreground">
                      {event.location_name}, {event.city}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Payment</p>
                {getPaymentBadge()}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Boarding</p>
                {getBoardingBadge()}
              </div>
            </div>

            {ticket.boardingStatus !== "boarded" && (
              <>
                <Button
                  onClick={markBoarded}
                  disabled={boarding || ticket.paymentStatus !== "paid"}
                  className="w-full"
                >
                  {boarding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking as boarded...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Mark as Boarded
                    </>
                  )}
                </Button>
                {ticket.paymentStatus !== "paid" && (
                  <p className="text-xs text-amber-700 text-center">
                    Payment must be confirmed (Paid) before boarding can be recorded.
                  </p>
                )}
              </>
            )}

            <Button variant="outline" className="w-full" onClick={scanNext}>
              <ScanLine className="h-4 w-4 mr-2" />
              Scan Next Attendee
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
