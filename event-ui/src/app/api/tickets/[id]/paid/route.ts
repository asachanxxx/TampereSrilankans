import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * PATCH /api/tickets/[id]/paid
 * Confirm that the attendee has paid (manual confirmation by staff).
 * Only organizers, moderators, and admins can perform this action.
 *
 * Prerequisites (enforced by TicketService):
 *  - payment_status must be 'payment_sent'.
 *
 * No body required.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth();
    const supabase = await createClient();
    const ticketService = new TicketService(supabase);

    const ticket = await ticketService.markPaid(params.id, actor);

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/tickets/[id]/paid error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json({ error: error.message || 'Failed to mark ticket as paid' }, { status });
  }
}
