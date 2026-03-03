import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@backend/lib/supabase/server';
import { RegistrationService } from '@backend/services/RegistrationService';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '../../../lib/auth';
import { sendTicketEmail } from '../../../lib/emailService';

/**
 * POST /api/registrations
 * Register for an event.
 * - If the request includes a valid session: authenticated registration.
 * - If no session (guest=true): anonymous registration, ticket link emailed.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const registrationService = new RegistrationService(supabase);

    const body = await request.json();
    const {
      eventId,
      guest,          // boolean flag sent by the guest registration form
      fullName,
      whatsappNumber,
      email,
      spouseName,
      childrenUnder7Count,
      childrenOver7Count,
      childrenNamesAndAges,
      children,
      vegetarianMealCount,
      nonVegetarianMealCount,
      kidsMealCount,
      otherPreferences,
      consentToStorePersonalData,
    } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const formData = {
      fullName,
      whatsappNumber,
      email,
      spouseName,
      childrenUnder7Count,
      childrenOver7Count,
      childrenNamesAndAges,
      children: children ?? [],
      vegetarianMealCount,
      nonVegetarianMealCount,
      kidsMealCount,
      otherPreferences,
      consentToStorePersonalData,
    };

    // ── Guest path ──────────────────────────────────────────────────────────
    if (guest) {
      // Use service role client to bypass RLS for anonymous registration
      const adminSupabase = createAdminClient();
      const guestRegistrationService = new RegistrationService(adminSupabase);
      const { registration, ticket } = await guestRegistrationService.registerGuest(eventId, formData);

      // Send ticket email fire-and-forget (failure must not break the response)
      adminSupabase.from('events').select('title').eq('id', eventId).single()
        .then(({ data: eventRow }) => {
          console.log(`[email] Sending ticket email to ${email} for event "${eventRow?.title}" (ticket: ${ticket.ticketNumber})`);
          sendTicketEmail(email, fullName, eventRow?.title ?? 'the event', ticket.ticketNumber)
            .then(() => console.log(`[email] Ticket email sent successfully to ${email} (ticket: ${ticket.ticketNumber})`))
            .catch((err) => console.error(`[email] Failed to send ticket email to ${email}:`, err));
        });

      return NextResponse.json(
        {
          registration,
          ticketNumber: ticket.ticketNumber,
          message: 'Successfully registered. Your ticket link has been sent to your email.',
        },
        { status: 201 }
      );
    }

    // ── Authenticated path ───────────────────────────────────────────────────
    const user = await requireAuth();

    const registration = await registrationService.registerForEvent(
      user.id,
      eventId,
      user,
      formData
    );

    // Send ticket email fire-and-forget
    Promise.all([
      new TicketService(supabase).getUserTicketForEvent(user.id, eventId, user),
      supabase.from('events').select('title').eq('id', eventId).single(),
    ]).then(([ticket, { data: eventRow }]) => {
      if (ticket) {
        console.log(`[email] Sending ticket email to ${formData.email} for event "${eventRow?.title}" (ticket: ${ticket.ticketNumber})`);
        sendTicketEmail(formData.email, formData.fullName, eventRow?.title ?? 'the event', ticket.ticketNumber)
          .then(() => console.log(`[email] Ticket email sent successfully to ${formData.email} (ticket: ${ticket.ticketNumber})`))
          .catch((err) => console.error(`[email] Failed to send ticket email to ${formData.email}:`, err));
      } else {
        console.warn(`[email] No ticket found for user ${user.id} on event ${eventId} — email not sent.`);
      }
    }).catch((err) => console.error('[email] Failed to prepare ticket email:', err));

    return NextResponse.json(
      {
        registration,
        message: 'Successfully registered for event. Ticket has been generated.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register for event' },
      {
        status: error.message?.includes('Authentication') ? 401
          : error.message?.includes('already registered') ? 409
          : error.message?.includes('not found') ? 404
          : error.message?.includes('permission') ? 403
          : error.message?.includes('not open') ? 400
          : 500,
      }
    );
  }
}

/**
 * GET /api/registrations
 * Get user's registrations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const registrationService = new RegistrationService(supabase);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Check if user is registered for specific event
      const isRegistered = await registrationService.isUserRegistered(userId, eventId);
      return NextResponse.json({ isRegistered }, { status: 200 });
    } else {
      // Get all registrations for user
      const registrations = await registrationService.getUserRegistrations(userId, user);
      return NextResponse.json({ registrations }, { status: 200 });
    }
  } catch (error: any) {
    console.error('GET /api/registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrations' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/registrations
 * Cancel a registration
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const registrationService = new RegistrationService(supabase);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await registrationService.cancelRegistration(user.id, eventId, user);

    return NextResponse.json(
      { message: 'Registration cancelled successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE /api/registrations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel registration' },
      { 
        status: error.message?.includes('Authentication') ? 401
          : error.message?.includes('not registered') ? 404
          : error.message?.includes('past event') ? 400
          : 500 
      }
    );
  }
}
