import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { EventService } from '@backend/services/EventService';
import { RegistrationRepository } from '@backend/repositories/RegistrationRepository';
import { getCurrentUser } from '../../../../lib/auth';

/**
 * GET /api/events/[id]
 * Get event details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const eventService = new EventService(supabase);
    const registrationRepo = new RegistrationRepository(supabase);
    const user = await getCurrentUser();

    const eventId = params.id;

    // Check if user is registered (for private event access)
    let isRegistered = false;
    if (user) {
      isRegistered = await registrationRepo.isUserRegistered(user.id, eventId);
    }

    const event = await eventService.getEventById(eventId, user, isRegistered);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    console.error(`GET /api/events/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[id]
 * Update event (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const eventService = new EventService(supabase);
    const user = await getCurrentUser();

    const eventId = params.id;
    const body = await request.json();

    const event = await eventService.updateEvent(eventId, body, user);

    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    console.error(`PUT /api/events/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { 
        status: error.message?.includes('admin') ? 403 
          : error.message?.includes('not found') ? 404 
          : error.message?.includes('Validation') ? 400 
          : 500 
      }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete event (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const eventService = new EventService(supabase);
    const user = await getCurrentUser();

    const eventId = params.id;

    await eventService.deleteEvent(eventId, user);

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/events/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { 
        status: error.message?.includes('admin') ? 403 
          : error.message?.includes('not found') ? 404 
          : 500 
      }
    );
  }
}
