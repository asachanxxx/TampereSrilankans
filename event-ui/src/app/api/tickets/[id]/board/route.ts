import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * PATCH /api/tickets/[id]/board
 * Mark a ticket as boarded (attendee checked in at event entrance).
 * Only organizers, moderators, and admins can perform this action.
 *
 * This endpoint is designed to be called when a staff member scans the
 * attendee's QR code at the event entrance and confirms boarding.
 * The acting user's ID is automatically recorded as the boarder.
 *
 * Prerequisites (enforced by TicketService):
 *  - payment_status must be 'paid'.
 *  - boarding_status must be NULL (not already boarded).
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

    // The actor (staff member scanning QR) is recorded as the boarder
    const ticket = await ticketService.markBoarded(params.id, actor.id, actor);

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/tickets/[id]/board error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json({ error: error.message || 'Failed to board ticket' }, { status });
  }
}
