import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { getCurrentUser, requireAuth } from '../../../lib/auth';

/**
 * GET /api/tickets
 * Get tickets for a user or view/verify a ticket by number (public).
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

    // Public ticket lookup by number — uses service role to bypass RLS for guest tickets
    if (ticketNumber) {
      const adminSupabase = createAdminClient();
      const publicTicketService = new TicketService(adminSupabase);
      const ticket = await publicTicketService.getTicketByNumber(ticketNumber);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      // Fetch event details to display on the ticket page
      const { data: eventRow } = await adminSupabase
        .from('events')
        .select('title, event_date, location_name, city')
        .eq('id', ticket.eventId)
        .single();

      // Fetch registration details (phone, spouse, children)
      let regRow: { whatsapp_number: string | null; spouse_name: string | null; children_under_7_count: number; children_over_7_count: number } | null = null;
      if (ticket.userId) {
        const { data } = await adminSupabase
          .from('event_registrations')
          .select('whatsapp_number, spouse_name, children_under_7_count, children_over_7_count')
          .eq('event_id', ticket.eventId)
          .eq('user_id', ticket.userId)
          .single();
        regRow = data ?? null;
      }
      if (!regRow && ticket.issuedToEmail) {
        const { data } = await adminSupabase
          .from('event_registrations')
          .select('whatsapp_number, spouse_name, children_under_7_count, children_over_7_count')
          .eq('event_id', ticket.eventId)
          .ilike('email', ticket.issuedToEmail)
          .single();
        regRow = data ?? null;
      }

      const registration = regRow ? {
        whatsappNumber: regRow.whatsapp_number ?? null,
        spouseName: regRow.spouse_name ?? null,
        childrenUnder7Count: regRow.children_under_7_count ?? 0,
        childrenOver7Count: regRow.children_over_7_count ?? 0,
      } : null;

      return NextResponse.json({ ticket, event: eventRow ?? null, registration }, { status: 200 });
    }

    // User tickets - requires authentication
    const user = await requireAuth();

    if (eventId) {
      // Get user's ticket for specific event
      const ticket = await ticketService.getUserTicketForEvent(user.id, eventId, user);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found for this event' }, { status: 404 });
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
