"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Search, FileText, Utensils, Baby } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = "attendees" | "meals" | "children";

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
type AnyRow = AttendeeRow | MealRow | ChildrenRow;

// ─── Config ───────────────────────────────────────────────────────────────────

const REPORT_META: Record<ReportType, { title: string; badge: string }> = {
  attendees: { title: "Full Attendees Report", badge: "Attendees" },
  meals:     { title: "Meal Report",           badge: "Meals"     },
  children:  { title: "Children's Report",     badge: "Children"  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
//asASasdded line to trigger deploy preview
function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape), ...rows.map((r) => r.map(escape))].map((r) => r.join(",")).join("\n");
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  Boarded:        "bg-purple-100 text-purple-700",
  Paid:           "bg-green-100 text-green-700",
  "Payment Sent": "bg-amber-100 text-amber-700",
  Assigned:       "bg-blue-100 text-blue-700",
  New:            "bg-zinc-100 text-zinc-600",
};

// ─── Sub-tables ───────────────────────────────────────────────────────────────

function AttendeesTable({ rows, search }: { rows: AttendeeRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) =>
      [r.fullName, r.email, r.whatsapp, r.spouse, r.ticketStatus, r.assignedStaff].some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">{filtered.length} of {rows.length} attendees</p>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>
              {["Full Name","Email","WhatsApp","Spouse / Partner","Under 7","Over 7","Total Children","Ticket Status","Assigned Staff"]
                .map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
            </tr>
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
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_COLORS[r.ticketStatus] ?? "bg-muted"}`}>
                    {r.ticketStatus}
                  </span>
                </td>
                <td className="px-3 py-2">{r.assignedStaff}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MealsTable({ rows, search }: { rows: MealRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) =>
      [r.fullName, r.whatsapp, r.otherPreferences].some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  // Totals
  const totals = useMemo(() => filtered.reduce(
    (acc, r) => ({ veg: acc.veg + r.vegMeals, nonVeg: acc.nonVeg + r.nonVegMeals, kids: acc.kids + r.kidsMeals }),
    { veg: 0, nonVeg: 0, kids: 0 }
  ), [filtered]);

  return (
    <>
      <div className="flex gap-4 mb-3">
        <p className="text-xs text-muted-foreground">{filtered.length} of {rows.length} registrations</p>
        <p className="text-xs text-muted-foreground">Veg: <span className="font-semibold text-foreground">{totals.veg}</span></p>
        <p className="text-xs text-muted-foreground">Non-Veg: <span className="font-semibold text-foreground">{totals.nonVeg}</span></p>
        <p className="text-xs text-muted-foreground">Kids: <span className="font-semibold text-foreground">{totals.kids}</span></p>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>
              {["Full Name","WhatsApp","Veg Meals","Non-Veg Meals","Kids Meals","Other Preferences / Allergies"]
                .map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
            </tr>
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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ChildrenTable({ rows, search }: { rows: ChildrenRow[]; search: string }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? rows : rows.filter((r) =>
      [r.fullName, r.whatsapp, r.notes].some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalChildren = useMemo(() => filtered.reduce((acc, r) => acc + r.total, 0), [filtered]);

  return (
    <>
      <div className="flex gap-4 mb-3">
        <p className="text-xs text-muted-foreground">{filtered.length} of {rows.length} registrations</p>
        <p className="text-xs text-muted-foreground">Total Children: <span className="font-semibold text-foreground">{totalChildren}</span></p>
      </div>
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium">
            <tr>
              {["Full Name","WhatsApp","Children Under 12","Children 12+","Total Children","Notes"]
                .map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
            </tr>
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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── CSV builders ─────────────────────────────────────────────────────────────

function buildCSV(type: ReportType, rows: AnyRow[]): string {
  if (type === "attendees") {
    const headers = ["Full Name","Email","WhatsApp","Spouse / Partner","Children Under 12","Children 12+","Total Children","Ticket Status","Assigned Staff"];
    const data = (rows as AttendeeRow[]).map((r) => [r.fullName, r.email, r.whatsapp, r.spouse, String(r.under7), String(r.over7), String(r.totalChildren), r.ticketStatus, r.assignedStaff]);
    return toCSV(headers, data);
  }
  if (type === "meals") {
    const headers = ["Full Name","WhatsApp","Veg Meals","Non-Veg Meals","Kids Meals","Other Preferences"];
    const data = (rows as MealRow[]).map((r) => [r.fullName, r.whatsapp, String(r.vegMeals), String(r.nonVegMeals), String(r.kidsMeals), r.otherPreferences]);
    return toCSV(headers, data);
  }
  // children
  const headers = ["Full Name","WhatsApp","Children Under 12","Children 12+","Total Children","Notes"];
  const data = (rows as ChildrenRow[]).map((r) => [r.fullName, r.whatsapp, String(r.under7), String(r.over7), String(r.total), r.notes]);
  return toCSV(headers, data);
}

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS: { type: ReportType; label: string; icon: React.ReactNode }[] = [
  { type: "attendees", label: "Attendees",  icon: <FileText  className="h-4 w-4" /> },
  { type: "meals",     label: "Meals",      icon: <Utensils  className="h-4 w-4" /> },
  { type: "children",  label: "Children's", icon: <Baby      className="h-4 w-4" /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const params = useParams<{ eventId: string; type: string }>();
  const eventId = params.eventId;
  const initialType: ReportType =
    (params.type as ReportType) in REPORT_META ? (params.type as ReportType) : "attendees";

  const [activeType, setActiveType] = useState<ReportType>(initialType);
  const [eventTitle, setEventTitle]  = useState("");

  // Per-tab lazy cache: undefined = not yet fetched
  const dataCache = useRef<Partial<Record<ReportType, AnyRow[]>>>({});
  const [tabLoading, setTabLoading]  = useState<ReportType | null>(initialType);
  const [tabError,   setTabError]    = useState<Partial<Record<ReportType, string>>>({});
  const [searchByType, setSearchByType] = useState<Record<ReportType, string>>(
    { attendees: "", meals: "", children: "" }
  );
  // Dummy counter to force a re-render after cache writes
  const [, forceUpdate] = useState(0);

  // Fetch event title once on mount
  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((d) => setEventTitle(d?.event?.title ?? d?.title ?? ""))
      .catch(() => {});
  }, [eventId]);

  // Lazy-fetch a single report type (no-op if already cached)
  const fetchTab = useCallback(
    (type: ReportType) => {
      if (dataCache.current[type] !== undefined) return;
      setTabLoading(type);
      fetch(`/api/admin/events/${eventId}/report?type=${type}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          dataCache.current[type] = data.rows ?? [];
          forceUpdate((n) => n + 1);
        })
        .catch((e) =>
          setTabError((prev) => ({ ...prev, [type]: e.message }))
        )
        .finally(() =>
          setTabLoading((prev) => (prev === type ? null : prev))
        );
    },
    [eventId]
  );

  // Fetch the initial tab on mount
  useEffect(() => { fetchTab(initialType); }, [fetchTab, initialType]);

  const handleTabChange = (type: ReportType) => {
    setActiveType(type);
    fetchTab(type);
  };

  const activeRows   = dataCache.current[activeType] ?? null;
  const isLoading    = tabLoading === activeType;
  const activeError  = tabError[activeType];
  const activeSearch = searchByType[activeType];

  const handleExport = () => {
    if (!activeRows) return;
    const csv = buildCSV(activeType, activeRows);
    const safeName = (eventTitle || eventId).replace(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadCSV(`${safeName}_${activeType}_report.csv`, csv);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Event title */}
      {eventTitle && (
        <p className="text-sm text-muted-foreground font-medium">{eventTitle}</p>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => handleTabChange(tab.type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeType === tab.type
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.icon}
            {tab.label}
            {/* Show a small loading dot when this tab is fetching */}
            {tabLoading === tab.type && (
              <span className="ml-1 flex h-1.5 w-1.5 rounded-full bg-current opacity-60 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Per-tab header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold">{REPORT_META[activeType].title}</h1>
        <Button
          onClick={handleExport}
          disabled={isLoading || !activeRows || activeRows.length === 0}
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter results…"
          value={activeSearch}
          onChange={(e) =>
            setSearchByType((prev) => ({ ...prev, [activeType]: e.target.value }))
          }
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {activeError}
        </div>
      ) : activeType === "attendees" && activeRows ? (
        <AttendeesTable rows={activeRows as AttendeeRow[]} search={activeSearch} />
      ) : activeType === "meals" && activeRows ? (
        <MealsTable rows={activeRows as MealRow[]} search={activeSearch} />
      ) : activeRows ? (
        <ChildrenTable rows={activeRows as ChildrenRow[]} search={activeSearch} />
      ) : null}
    </div>
  );
}
