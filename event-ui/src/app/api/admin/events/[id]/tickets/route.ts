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

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/[id]/tickets error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 :
      500;
    return NextResponse.json({ error: error.message || 'Failed to fetch tickets' }, { status });
  }
}
