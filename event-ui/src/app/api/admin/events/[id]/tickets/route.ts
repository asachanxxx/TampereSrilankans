import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { TicketRepository } from '@backend/repositories/TicketRepository';
import { requireOrganizer } from '@/lib/auth';

/**
 * GET /api/admin/events/[id]/tickets
 * Return all tickets for a specific event.
 * Requires organizer / moderator / admin role.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireOrganizer();

    // Use admin client to bypass RLS (staff reading all tickets)
    const supabase = createAdminClient();
    const repo = new TicketRepository(supabase);

    const tickets = await repo.getEventTickets(params.id);

    // Enrich with whatsapp numbers and registration details from event_registrations
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('user_id, email, whatsapp_number, spouse_name, children_over_7_count')
      .eq('event_id', params.id);

    type RegRecord = { user_id: string | null; email: string; whatsapp_number: string | null; spouse_name: string | null; children_over_7_count: number | null };
    const regByUserId = new Map<string, RegRecord>();
    const regByEmail = new Map<string, RegRecord>();
    (regs ?? []).forEach((r: RegRecord) => {
      if (r.user_id) regByUserId.set(r.user_id, r);
      if (r.email) regByEmail.set(r.email.toLowerCase(), r);
    });

    const enriched = tickets.map((t) => {
      const reg =
        (t.userId ? regByUserId.get(t.userId) : undefined) ??
        regByEmail.get(t.issuedToEmail.toLowerCase());
      return {
        ...t,
        whatsappNumber: reg?.whatsapp_number ?? null,
        spouseName: reg?.spouse_name ?? null,
        childrenOver7Count: reg?.children_over_7_count ?? 0,
      };
    });

    return NextResponse.json({ tickets: enriched }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/[id]/tickets error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 :
      500;
    return NextResponse.json({ error: error.message || 'Failed to fetch tickets' }, { status });
  }
}
