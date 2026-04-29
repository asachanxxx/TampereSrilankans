"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Baby,
  Download,
  FileBarChart,
  FileText,
  Loader2,
  Search,
  Ticket,
  Users,
  Utensils,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = "attendees" | "meals" | "children" | "paid_tickets" | "financial_summary";

type AttendeeRow = {
  fullName: string; email: string; whatsapp: string; spouse: string;
  under7: number; over7: number; totalChildren: number;
  ticketStatus: string; assignedStaff: string;
};
type MealRow = {
  fullName: string; whatsapp: string;
  vegMeals: number; nonVegMeals: number; kidsMeals: number; otherPreferences: string;
};
type ChildrenRow = {
  fullName: string; whatsapp: string;
  under7: number; over7: number; total: number; notes: string;
};
type PaidTicketRow = {
  ticketNumber: string; name: string; status: string;
  adults: number; childrenOver7: number; paidAt: string;
};
type FinancialRow = { ticketNumber: string; status: string; amount: number };
type FinancialSummaryData = { ticketPrice: number; currency: string; rows: FinancialRow[] };
type AnyRow = AttendeeRow | MealRow | ChildrenRow | PaidTicketRow;

type EventItem = { id: string; title: string; event_date?: string | null };

// ─── Report meta ─────────────────────────────────────────────────────────────

const REPORTS: { type: ReportType; label: string; icon: React.ReactNode }[] = [
  { type: "attendees",         label: "Attendees",         icon: <Users       className="h-4 w-4" /> },
  { type: "meals",             label: "Meals",             icon: <Utensils    className="h-4 w-4" /> },
  { type: "children",          label: "Children's",        icon: <Baby        className="h-4 w-4" /> },
  { type: "paid_tickets",      label: "Paid Tickets",      icon: <Ticket      className="h-4 w-4" /> },
  { type: "financial_summary", label: "Financial Summary", icon: <FileBarChart className="h-4 w-4" /> },
];

const REPORT_TITLE: Record<ReportType, string> = {
  attendees:         "Full Attendees Report",
  meals:             "Meal Report",
  children:          "Children's Report",
  paid_tickets:      "Paid Tickets List",
  financial_summary: "Financial Summary",
};

// ─── Export helpers ───────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape), ...rows.map((r) => r.map(escape))].map((r) => r.join(",")).join("\n");
}
function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function downloadCSV(filename: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: "text/csv;charset=utf-8;" }));
}
function downloadExcel(filename: string, headers: string[], rows: string[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, filename);
}
function downloadPDF(filename: string, title: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(12);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [51, 51, 51] },
  });
  doc.save(filename);
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

// ─── Table data builders ──────────────────────────────────────────────────────

function buildTableData(type: ReportType, rows: AnyRow[] | FinancialSummaryData): { headers: string[]; data: string[][] } {
  if (type === "attendees") {
    return {
      headers: ["Full Name", "Email", "WhatsApp", "Spouse / Partner", "Children Under 7", "Children 7+", "Total Children", "Ticket Status", "Assigned Staff"],
      data: (rows as AttendeeRow[]).map((r) => [r.fullName, r.email, r.whatsapp, r.spouse, String(r.under7), String(r.over7), String(r.totalChildren), r.ticketStatus, r.assignedStaff]),
    };
  }
  if (type === "meals") {
    return {
      headers: ["Full Name", "WhatsApp", "Veg Meals", "Non-Veg Meals", "Kids Meals", "Other Preferences"],
      data: (rows as MealRow[]).map((r) => [r.fullName, r.whatsapp, String(r.vegMeals), String(r.nonVegMeals), String(r.kidsMeals), r.otherPreferences]),
    };
  }
  if (type === "children") {
    return {
      headers: ["Full Name", "WhatsApp", "Children Under 7", "Children 7+", "Total Children", "Notes"],
      data: (rows as ChildrenRow[]).map((r) => [r.fullName, r.whatsapp, String(r.under7), String(r.over7), String(r.total), r.notes]),
    };
  }
  if (type === "paid_tickets") {
    return {
      headers: ["Ticket #", "Name", "Status", "Adults", "Children (7+)", "Paid At", "Boarded"],
      data: (rows as PaidTicketRow[]).map((r) => [r.ticketNumber, r.name, r.status, String(r.adults), String(r.childrenOver7), formatDateTime(r.paidAt), ""]),
    };
  }
  // financial_summary
  const fs = rows as FinancialSummaryData;
  const fsTotal = fs.rows.reduce((sum, r) => sum + r.amount, 0);
  return {
    headers: ["Ticket #", "Status", "Ticket Price", "Amount"],
    data: [
      ...fs.rows.map((r) => [r.ticketNumber, r.status, `${fs.currency} ${r.amount.toFixed(2)}`, `${fs.currency} ${r.amount.toFixed(2)}`]),
      ["", "", "", ""],
      ["Total Amount", "", "", `${fs.currency} ${fsTotal.toFixed(2)}`],
    ],
  };
}

// ─── Status badge colors ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Boarded:        "bg-purple-100 text-purple-700",
  Paid:           "bg-green-100 text-green-700",
  "Paid + Bonus": "bg-teal-100 text-teal-700",
  "Payment Sent": "bg-amber-100 text-amber-700",
  Assigned:       "bg-blue-100 text-blue-700",
  New:            "bg-zinc-100 text-zinc-600",
  "Not Coming":   "bg-rose-100 text-rose-700",
};

// ─── Sub-tables ───────────────────────────────────────────────────────────────

function AttendeesTable({ rows, search }: { rows: AttendeeRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) =>
      [r.fullName, r.email, r.whatsapp, r.spouse, r.ticketStatus].some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);
  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">{filtered.length} of {rows.length} attendees</p>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>{["Full Name","Email","WhatsApp","Spouse / Partner","Under 7","7+","Total","Status","Staff"].map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.fullName}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                <td className="px-3 py-2">{r.whatsapp}</td>
                <td className="px-3 py-2">{r.spouse || "—"}</td>
                <td className="px-3 py-2 text-center">{r.under7}</td>
                <td className="px-3 py-2 text-center">{r.over7}</td>
                <td className="px-3 py-2 text-center font-medium">{r.totalChildren}</td>
                <td className="px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.ticketStatus] ?? "bg-muted"}`}>{r.ticketStatus}</span></td>
                <td className="px-3 py-2">{r.assignedStaff}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MealsTable({ rows, search }: { rows: MealRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) => [r.fullName, r.whatsapp, r.otherPreferences].some((v) => v.toLowerCase().includes(q)));
  }, [rows, search]);
  const totals = useMemo(() => filtered.reduce((acc, r) => ({ veg: acc.veg + r.vegMeals, nonVeg: acc.nonVeg + r.nonVegMeals, kids: acc.kids + r.kidsMeals }), { veg: 0, nonVeg: 0, kids: 0 }), [filtered]);
  return (
    <>
      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <span>{filtered.length} of {rows.length}</span>
        <span>Veg: <b className="text-foreground">{totals.veg}</b></span>
        <span>Non-Veg: <b className="text-foreground">{totals.nonVeg}</b></span>
        <span>Kids: <b className="text-foreground">{totals.kids}</b></span>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>{["Full Name","WhatsApp","Veg","Non-Veg","Kids","Preferences / Allergies"].map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.fullName}</td>
                <td className="px-3 py-2">{r.whatsapp}</td>
                <td className="px-3 py-2 text-center">{r.vegMeals}</td>
                <td className="px-3 py-2 text-center">{r.nonVegMeals}</td>
                <td className="px-3 py-2 text-center">{r.kidsMeals}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.otherPreferences || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ChildrenTable({ rows, search }: { rows: ChildrenRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) => [r.fullName, r.whatsapp, r.notes].some((v) => v.toLowerCase().includes(q)));
  }, [rows, search]);
  const total = useMemo(() => filtered.reduce((acc, r) => acc + r.total, 0), [filtered]);
  return (
    <>
      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <span>{filtered.length} of {rows.length}</span>
        <span>Total Children: <b className="text-foreground">{total}</b></span>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>{["Full Name","WhatsApp","Under 7","7+","Total","Notes"].map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.fullName}</td>
                <td className="px-3 py-2">{r.whatsapp}</td>
                <td className="px-3 py-2 text-center">{r.under7}</td>
                <td className="px-3 py-2 text-center">{r.over7}</td>
                <td className="px-3 py-2 text-center font-medium">{r.total}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.notes || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PaidTicketsTable({ rows, search }: { rows: PaidTicketRow[]; search: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || [r.ticketNumber, r.name, r.status].some((v) => v.toLowerCase().includes(q));
      const matchesFilter =
        statusFilter === "paid"       ? (r.status === "Paid" || r.status === "Boarded") :
        statusFilter === "paid_bonus" ? r.status === "Paid + Bonus" :
        statusFilter === "not_paid"   ? !["Paid", "Paid + Bonus", "Boarded"].includes(r.status) :
        true;
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, statusFilter]);
  return (
    <>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{filtered.length} of {rows.length} tickets</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="paid_bonus">Paid + Bonus</SelectItem>
            <SelectItem value="not_paid">Not Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>{["Ticket #","Name","Status","Adults","Children (7+)","Paid At","Boarded"].map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{r.ticketNumber}</td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.name}</td>
                <td className="px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>{r.status}</span></td>
                <td className="px-3 py-2 text-center">{r.adults}</td>
                <td className="px-3 py-2 text-center">{r.childrenOver7}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(r.paidAt)}</td>
                <td className="px-3 py-2 w-16"></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No tickets found</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FinancialSummaryView({ data }: { data: FinancialSummaryData }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = useMemo(() => {
    if (statusFilter === "paid_plus")    return data.rows.filter((r) => ["Paid", "Paid + Bonus", "Boarded"].includes(r.status));
    if (statusFilter === "payment_sent") return data.rows.filter((r) => r.status === "Payment Sent");
    return data.rows;
  }, [data.rows, statusFilter]);
  const totalAmount = useMemo(() => filtered.reduce((sum, r) => sum + r.amount, 0), [filtered]);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{filtered.length} of {data.rows.length} tickets</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid_plus">Paid + Paid Bonus</SelectItem>
            <SelectItem value="payment_sent">Payment Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">Ticket #</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Status</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Ticket Price</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{r.ticketNumber}</td>
                <td className="px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>{r.status}</span></td>
                <td className="px-3 py-2 text-right">{data.currency} {data.ticketPrice.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-medium">{data.currency} {r.amount.toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No tickets found</td></tr>}
          </tbody>
          <tfoot className="border-t-2 bg-muted/30 font-semibold">
            <tr>
              <td colSpan={3} className="px-3 py-3 text-right">Total Amount</td>
              <td className="px-3 py-3 text-right text-base font-bold">{data.currency} {totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [events, setEvents]             = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [activeType, setActiveType]     = useState<ReportType>("attendees");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // Per-event + per-type cache: { [eventId]: { [type]: data } }
  const cache = useRef<Record<string, Partial<Record<ReportType, AnyRow[] | FinancialSummaryData>>>>({});
  const [, forceUpdate] = useState(0);

  // Load all events
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        const list: EventItem[] = d.events ?? [];
        list.sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));
        setEvents(list);
        if (list.length === 1) {
          setSelectedEventId(list[0].id);
          setSelectedEventTitle(list[0].title);
        }
      })
      .catch(() => setError("Failed to load events"))
      .finally(() => setEventsLoading(false));
  }, []);

  const fetchReport = useCallback(async (eventId: string, type: ReportType) => {
    if (!eventId) return;
    if (cache.current[eventId]?.[type] !== undefined) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/events/${eventId}/report?type=${type}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!cache.current[eventId]) cache.current[eventId] = {};
      // financial_summary returns an object, everything else returns { rows }
      cache.current[eventId]![type] = type === "financial_summary" ? data : (data.rows ?? []);
      forceUpdate((n) => n + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on event or type change
  useEffect(() => {
    if (selectedEventId) fetchReport(selectedEventId, activeType);
  }, [selectedEventId, activeType, fetchReport]);

  const handleEventChange = (id: string) => {
    const ev = events.find((e) => e.id === id);
    setSelectedEventId(id);
    setSelectedEventTitle(ev?.title ?? "");
    setSearch("");
  };

  const handleTypeChange = (type: ReportType) => {
    setActiveType(type);
    setSearch("");
  };

  const activeData = selectedEventId ? cache.current[selectedEventId]?.[activeType] : undefined;
  const isFinancial = activeType === "financial_summary";
  const hasRows = activeData !== undefined && (isFinancial ? true : (activeData as AnyRow[]).length > 0);

  const safeName = () => selectedEventTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase() || selectedEventId;

  const getExportData = () => buildTableData(activeType, activeData as any);

  const handleCSV = () => {
    const { headers, data } = getExportData();
    downloadCSV(`${safeName()}_${activeType}.csv`, toCSV(headers, data));
  };
  const handleExcel = () => {
    const { headers, data } = getExportData();
    downloadExcel(`${safeName()}_${activeType}.xlsx`, headers, data);
  };
  const handlePDF = () => {
    const { headers, data } = getExportData();
    downloadPDF(`${safeName()}_${activeType}.pdf`, `${selectedEventTitle} — ${REPORT_TITLE[activeType]}`, headers, data);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="h-6 w-6" />
          Reports
        </h1>
      </div>

      {/* Event selector */}
      <div className="max-w-sm">
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
          </div>
        ) : (
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event…" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Report type buttons */}
      <div className="flex flex-wrap gap-2">
        {REPORTS.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            disabled={!selectedEventId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              activeType === type && selectedEventId
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Report header row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">{REPORT_TITLE[activeType]}</h2>
              {selectedEventTitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{selectedEventTitle}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCSV} disabled={loading || !hasRows}>
                <Download className="h-4 w-4 mr-1.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={handleExcel} disabled={loading || !hasRows}>
                <Download className="h-4 w-4 mr-1.5" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={handlePDF} disabled={loading || !hasRows}>
                <Download className="h-4 w-4 mr-1.5" /> PDF
              </Button>
            </div>
          </div>

          {/* Search (not shown for financial summary) */}
          {!isFinancial && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Filter results…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeData !== undefined ? (
            <>
              {activeType === "attendees"         && <AttendeesTable     rows={activeData as AttendeeRow[]}   search={search} />}
              {activeType === "meals"             && <MealsTable         rows={activeData as MealRow[]}       search={search} />}
              {activeType === "children"          && <ChildrenTable      rows={activeData as ChildrenRow[]}   search={search} />}
              {activeType === "paid_tickets"      && <PaidTicketsTable   rows={activeData as PaidTicketRow[]} search={search} />}
              {activeType === "financial_summary" && <FinancialSummaryView data={activeData as FinancialSummaryData} />}
            </>
          ) : null}
        </>
      )}

      {!selectedEventId && !eventsLoading && (
        <p className="text-sm text-muted-foreground">Select an event above to load reports.</p>
      )}
    </div>
  );
}
