"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  ScanLine,
  Search,
  Ticket,
  XCircle,
  UserCheck,
} from "lucide-react";
import type { Ticket as TicketType } from "@/models/ticket";
import { useSession } from "@/state/session";

type ScanResult = {
  ticket: TicketType;
  event: {
    title: string;
    event_date: string;
    location_name: string;
    city: string;
  } | null;
};

type SearchItem = {
  ticket: TicketType;
  eventTitle: string | null;
};

export default function CheckInPage() {
  const { profile } = useSession();
  const isAdmin = profile?.role === "admin";

  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [boardedSuccess, setBoardedSuccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search â€” fires 300ms after the user stops typing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/tickets/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(data.tickets ?? []);
      } catch {
        // silently ignore search errors
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    setSearchQuery("");
    setSearchResults([]);
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
    setSearchQuery("");
    setSearchResults([]);

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
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
        () => {}
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
      return (
        <div className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-100 px-3 py-1.5 text-red-700 font-semibold text-sm">
          <XCircle className="h-4 w-4" />
          Already Boarded
        </div>
      );
    return <Badge variant="outline">Not Boarded</Badge>;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          Event Check-in
        </h1>
      </div>

      {/* Scanner + Search */}
      <div className="space-y-3">
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
        {!scanning ? (
          <Button onClick={startScanner} className="w-full" disabled={loading}>
            <ScanLine className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
        ) : (
          <Button variant="outline" onClick={stopScanner} className="w-full">
            Stop Scanner
          </Button>
        )}

        {/* Manual search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, phone or ticket #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={scanning}
          />
        </div>

        {/* Search results dropdown */}
        {(searchLoading || (searchQuery.length >= 2 && searchResults.length >= 0)) && (
          <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
            {searchLoading && (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching...
              </div>
            )}
            {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="px-3 py-2.5 text-sm text-muted-foreground">No tickets found</div>
            )}
            {!searchLoading && searchResults.map((item) => (
              <button
                key={item.ticket.id}
                className="w-full text-left px-3 py-2.5 hover:bg-muted border-b last:border-b-0 transition-colors"
                onClick={() => lookupTicket(item.ticket.ticketNumber)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.ticket.issuedToName}</p>
                    <p className="text-xs text-muted-foreground">{item.ticket.issuedToEmail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{item.ticket.ticketNumber}</p>
                    {item.eventTitle && (
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{item.eventTitle}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

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
                  disabled={boarding || (ticket.paymentStatus !== "paid" && !isAdmin)}
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
                {!isAdmin && ticket.paymentStatus !== "paid" && (
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

