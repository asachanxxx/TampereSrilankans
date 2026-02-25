import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * PATCH /api/tickets/[id]/assign
 * Assign a ticket to a staff member (organizer / moderator / admin only).
 *
 * Body: { assigneeId: string }
 *   assigneeId — the profile UUID of the staff member taking ownership.
 *                Defaults to the actor's own ID if omitted.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth();
    const supabase = await createClient();
    const ticketService = new TicketService(supabase);

    const ticketId = params.id;

    // Parse body — assigneeId is optional; defaults to the acting user's ID
    let assigneeId: string = actor.id;
    try {
      const body = await request.json();
      if (body?.assigneeId) assigneeId = body.assigneeId;
    } catch {
      // empty body is fine — we default to self-assignment
    }

    const ticket = await ticketService.assignTicket(ticketId, assigneeId, actor);

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/tickets/[id]/assign error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json({ error: error.message || 'Failed to assign ticket' }, { status });
  }
}
