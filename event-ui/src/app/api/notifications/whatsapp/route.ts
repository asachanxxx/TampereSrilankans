import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { buildWhatsAppMessage } from '@/lib/emailService';
import { formatDate } from '@/lib/format';

/**
 * GET /api/notifications/whatsapp?ticketNumber=XXXX
 *
 * Returns the formatted WhatsApp message text for a given ticket.
 * Can be used by admins to copy/send messages, or by future automation.
 *
 * Also accepts ?registrationId=XXXX for looking up by registration.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const ticketNumber = searchParams.get('ticketNumber');

    if (!ticketNumber) {
      return NextResponse.json(
        { error: 'ticketNumber query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, event_date, location_name, city')
      .eq('id', ticket.event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch whatsapp number from registration (if available)
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('whatsapp_number')
      .eq('event_id', ticket.event_id)
      .eq('email', ticket.issued_to_email)
      .maybeSingle();

    const message = buildWhatsAppMessage({
      toName: ticket.issued_to_name,
      eventTitle: event.title,
      eventDate: formatDate(event.event_date),
      locationName: event.location_name ?? '',
      city: event.city ?? '',
      ticketNumber: ticket.ticket_number,
    });

    return NextResponse.json({
      message,
      recipient: {
        name: ticket.issued_to_name,
        email: ticket.issued_to_email,
        whatsappNumber: registration?.whatsapp_number ?? null,
      },
      ticketNumber: ticket.ticket_number,
    });
  } catch (error: any) {
    console.error('GET /api/notifications/whatsapp error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build WhatsApp message' },
      { status: 500 }
    );
  }
}
