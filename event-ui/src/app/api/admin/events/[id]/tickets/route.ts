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

    // Enrich with whatsapp numbers from event_registrations
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('user_id, email, whatsapp_number')
      .eq('event_id', params.id);

    const regByUserId = new Map<string, string>();
    const regByEmail = new Map<string, string>();
    (regs ?? []).forEach((r: any) => {
      if (r.user_id && r.whatsapp_number) regByUserId.set(r.user_id, r.whatsapp_number);
      if (r.email && r.whatsapp_number) regByEmail.set(r.email.toLowerCase(), r.whatsapp_number);
    });

    const enriched = tickets.map((t) => ({
      ...t,
      whatsappNumber:
        (t.userId ? regByUserId.get(t.userId) : undefined) ??
        regByEmail.get(t.issuedToEmail.toLowerCase()) ??
        null,
    }));

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
