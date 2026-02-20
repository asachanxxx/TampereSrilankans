import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../../backend/lib/supabase/server';
import { TicketService } from '../../../../../../../backend/services/TicketService';
import { getCurrentUser, requireAuth } from '../../../lib/auth';

/**
 * GET /api/tickets
 * Get tickets for a user or verify a ticket
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ticketService = new TicketService(supabase);

    const { searchParams } = new URL(request.url);
    const ticketNumber = searchParams.get('ticketNumber');
    const eventId = searchParams.get('eventId');
    const verify = searchParams.get('verify');

    // Ticket verification (public - no auth required)
    if (ticketNumber && verify === 'true') {
      const result = await ticketService.verifyTicket(ticketNumber);
      return NextResponse.json(result, { status: 200 });
    }

    // Ticket lookup by number (public - no auth required)
    if (ticketNumber) {
      const ticket = await ticketService.getTicketByNumber(ticketNumber);
      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ticket }, { status: 200 });
    }

    // User tickets - requires authentication
    const user = await requireAuth();

    if (eventId) {
      // Get user's ticket for specific event
      const ticket = await ticketService.getUserTicketForEvent(user.id, eventId, user);
      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket not found for this event' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ticket }, { status: 200 });
    } else {
      // Get all tickets for user
      const tickets = await ticketService.getUserTickets(user.id, user);
      return NextResponse.json({ tickets }, { status: 200 });
    }
  } catch (error: any) {
    console.error('GET /api/tickets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}
