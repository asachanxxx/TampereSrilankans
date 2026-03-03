import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

type ReportType = 'attendees' | 'meals' | 'children';

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
    if (!type || !['attendees', 'meals', 'children'].includes(type)) {
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
