import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/tickets/[id]/reminder-sent
 * Increments the reminder_count for a ticket.
 * Called when staff copies or sends a payment reminder message.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth();
    const supabase = createAdminClient();
    const ticketService = new TicketService(supabase);

    const { reminderCount } = await ticketService.recordReminderSent(params.id, actor);

    return NextResponse.json({ reminderCount }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/tickets/[id]/reminder-sent error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json(
      { error: error.message || 'Failed to record reminder' },
      { status }
    );
  }
}
