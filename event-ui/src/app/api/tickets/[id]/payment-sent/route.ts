import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * PATCH /api/tickets/[id]/payment-sent
 * Mark payment details as sent to the attendee (organizer / moderator / admin only).
 *
 * Prerequisites (enforced by TicketService):
 *  - Ticket must be assigned to a staff member.
 *  - payment_status must be NULL (not previously actioned).
 *
 * Response includes the updated ticket AND a ready-to-copy payment message
 * the staff member can send to the attendee via WhatsApp, email, etc.
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

    const { ticket, paymentMessage } = await ticketService.markPaymentSent(params.id, actor);

    return NextResponse.json({ ticket, paymentMessage }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/tickets/[id]/payment-sent error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json({ error: error.message || 'Failed to mark payment sent' }, { status });
  }
}
