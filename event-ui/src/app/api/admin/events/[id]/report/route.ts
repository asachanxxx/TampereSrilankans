import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

type ReportType = 'attendees' | 'meals' | 'children' | 'paid_tickets' | 'financial_summary';

function deriveStage(t: {
  assigned_to_id: string | null;
  payment_status: string | null;
  boarding_status: string | null;
}): string {
  if (t.boarding_status === 'boarded') return 'Boarded';
  if (t.payment_status === 'paid') return 'Paid';
  if (t.payment_status === 'payment_sent') return 'Payment Sent';
  if (t.assigned_to_id !== null) return 'Assigned';
  return 'New';
}

/**
 * GET /api/admin/events/[id]/report?type=attendees|meals|children
 * Returns structured report data for the given event.
 * Requires admin role.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const type = request.nextUrl.searchParams.get('type') as ReportType | null;
    if (!type || !['attendees', 'meals', 'children', 'paid_tickets', 'financial_summary'].includes(type)) {
      return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const eventId = params.id;

    // ── Meals report ────────────────────────────────────────────────────────
    if (type === 'meals') {
      const { data: regs, error } = await supabase
        .from('event_registrations')
        .select('full_name, whatsapp_number, vegetarian_meal_count, non_vegetarian_meal_count, kids_meal_count, other_preferences')
        .eq('event_id', eventId)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const rows = (regs ?? []).map((r) => ({
        fullName: r.full_name,
        whatsapp: r.whatsapp_number ?? '',
        vegMeals: r.vegetarian_meal_count ?? 0,
        nonVegMeals: r.non_vegetarian_meal_count ?? 0,
        kidsMeals: r.kids_meal_count ?? 0,
        otherPreferences: r.other_preferences ?? '',
      }));

      return NextResponse.json({ rows }, { status: 200 });
    }

    // ── Children report ──────────────────────────────────────────────────────
    if (type === 'children') {
      const { data: regs, error } = await supabase
        .from('event_registrations')
        .select('full_name, whatsapp_number, children_under_7_count, children_over_7_count, children_names_and_ages')
        .eq('event_id', eventId)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const rows = (regs ?? []).map((r) => ({
        fullName: r.full_name,
        whatsapp: r.whatsapp_number ?? '',
        under7: r.children_under_7_count ?? 0,
        over7: r.children_over_7_count ?? 0,
        total: (r.children_under_7_count ?? 0) + (r.children_over_7_count ?? 0),
        notes: r.children_names_and_ages ?? '',
      }));

      return NextResponse.json({ rows }, { status: 200 });
    }

    // ── Paid Tickets report ──────────────────────────────────────────────────
    if (type === 'paid_tickets') {
      const [{ data: tix, error: tixErr }, { data: regs, error: regErr }] = await Promise.all([
        supabase
          .from('tickets')
          .select('ticket_number, issued_to_name, issued_to_email, payment_status, boarding_status, paid_at, user_id')
          .eq('event_id', eventId)
          .order('issued_to_name', { ascending: true }),
        supabase
          .from('event_registrations')
          .select('user_id, email, spouse_name, children_over_7_count')
          .eq('event_id', eventId),
      ]);

      if (tixErr) throw tixErr;
      if (regErr) throw regErr;

      const regByUserId = new Map((regs ?? []).filter((r) => r.user_id).map((r) => [r.user_id!, r]));
      const regByEmail = new Map((regs ?? []).map((r) => [r.email?.toLowerCase() ?? '', r]));

      const statusLabel = (t: { boarding_status: string | null; payment_status: string | null }) => {
        if (t.boarding_status === 'boarded') return 'Boarded';
        if (t.payment_status === 'paid_bonus') return 'Paid + Bonus';
        if (t.payment_status === 'paid') return 'Paid';
        if (t.payment_status === 'payment_sent') return 'Payment Sent';
        if (t.payment_status === 'not_coming') return 'Not Coming';
        return 'Unpaid';
      };

      const rows = (tix ?? []).map((t) => {
        const reg = (t.user_id ? regByUserId.get(t.user_id) : undefined)
          ?? regByEmail.get((t.issued_to_email ?? '').toLowerCase());
        const adults = 1 + (reg?.spouse_name?.trim() ? 1 : 0);
        return {
          ticketNumber: t.ticket_number,
          name: t.issued_to_name,
          status: statusLabel(t),
          adults,
          childrenOver7: reg?.children_over_7_count ?? 0,
          paidAt: t.paid_at ?? '',
        };
      });

      return NextResponse.json({ rows }, { status: 200 });
    }

    // ── Financial Summary report ─────────────────────────────────────────────
    if (type === 'financial_summary') {
      const [{ data: event }, { data: tix, error: tixErr }, { data: regs, error: regErr }] = await Promise.all([
        supabase.from('events').select('payment_instructions').eq('id', eventId).single(),
        supabase
          .from('tickets')
          .select('ticket_number, payment_status, boarding_status, user_id, issued_to_email')
          .eq('event_id', eventId)
          .order('ticket_number', { ascending: true }),
        supabase
          .from('event_registrations')
          .select('user_id, email, spouse_name, children_over_7_count')
          .eq('event_id', eventId),
      ]);

      if (tixErr) throw tixErr;
      if (regErr) throw regErr;

      const pi = event?.payment_instructions as any;
      // JSONB is stored with camelCase keys (serialised directly from TypeScript)
      const adultPrice: number =
        typeof pi?.adultTicketPrice === 'number' ? pi.adultTicketPrice :
        typeof pi?.amountPerPerson  === 'number' ? pi.amountPerPerson  : 0;
      const childPrice: number =
        typeof pi?.childTicketPrice === 'number' ? pi.childTicketPrice : 0;
      const currency: string = pi?.currency ?? 'EUR';

      const regByUserId = new Map((regs ?? []).filter((r) => r.user_id).map((r) => [r.user_id!, r]));
      const regByEmail  = new Map((regs ?? []).map((r) => [r.email?.toLowerCase() ?? '', r]));

      const statusLabel = (t: { boarding_status: string | null; payment_status: string | null }) => {
        if (t.boarding_status === 'boarded') return 'Boarded';
        if (t.payment_status === 'paid_bonus') return 'Paid + Bonus';
        if (t.payment_status === 'paid') return 'Paid';
        if (t.payment_status === 'payment_sent') return 'Payment Sent';
        if (t.payment_status === 'not_coming') return 'Not Coming';
        return 'Unpaid';
      };

      const rows = (tix ?? []).map((t) => {
        const reg = (t.user_id ? regByUserId.get(t.user_id) : undefined)
          ?? regByEmail.get((t.issued_to_email ?? '').toLowerCase());
        const adultCount = 1 + (reg?.spouse_name?.trim() ? 1 : 0);
        const childCount = reg?.children_over_7_count ?? 0;
        const amount = adultPrice * adultCount + childPrice * childCount;
        return {
          ticketNumber: t.ticket_number,
          status: statusLabel(t),
          adults: adultCount,
          children: childCount,
          amount,
        };
      });

      return NextResponse.json({ rows, adultPrice, childPrice, currency }, { status: 200 });
    }

    // ── Attendees report ─────────────────────────────────────────────────────
    const [{ data: regs, error: regErr }, { data: tix, error: tixErr }] = await Promise.all([
      supabase
        .from('event_registrations')
        .select('user_id, full_name, email, whatsapp_number, spouse_name, children_under_7_count, children_over_7_count')
        .eq('event_id', eventId)
        .order('full_name', { ascending: true }),
      supabase
        .from('tickets')
        .select('user_id, payment_status, boarding_status, assigned_to_id')
        .eq('event_id', eventId),
    ]);

    if (regErr) throw regErr;
    if (tixErr) throw tixErr;

    // Resolve staff display names in one query
    const assignedIds = [...new Set((tix ?? []).filter((t) => t.assigned_to_id).map((t) => t.assigned_to_id as string))];
    const { data: profileRows } = assignedIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', assignedIds)
      : { data: [] as { id: string; display_name: string }[] };

    const profileMap: Record<string, string> = Object.fromEntries(
      (profileRows ?? []).map((p) => [p.id, p.display_name])
    );
    const ticketByUser: Record<string, typeof tix[0]> = Object.fromEntries(
      (tix ?? []).filter((t) => t.user_id).map((t) => [t.user_id!, t])
    );

    const rows = (regs ?? []).map((r) => {
      const ticket = r.user_id ? ticketByUser[r.user_id] : undefined;
      return {
        fullName: r.full_name,
        email: r.email,
        whatsapp: r.whatsapp_number ?? '',
        spouse: r.spouse_name ?? '',
        under7: r.children_under_7_count ?? 0,
        over7: r.children_over_7_count ?? 0,
        totalChildren: (r.children_under_7_count ?? 0) + (r.children_over_7_count ?? 0),
        ticketStatus: ticket ? deriveStage(ticket) : '—',
        assignedStaff: ticket?.assigned_to_id ? (profileMap[ticket.assigned_to_id] ?? 'Unknown') : '—',
      };
    });

    return NextResponse.json({ rows }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/[id]/report error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status });
  }
}
