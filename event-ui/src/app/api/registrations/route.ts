import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { RegistrationService } from '@backend/services/RegistrationService';
import { getCurrentUser, requireAuth } from '../../../lib/auth';

/**
 * POST /api/registrations
 * Register user for an event
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const registrationService = new RegistrationService(supabase);

    const body = await request.json();
    const {
      eventId,
      fullName,
      whatsappNumber,
      email,
      spouseName,
      childrenUnder7Count,
      childrenOver7Count,
      childrenNamesAndAges,
      vegetarianMealCount,
      nonVegetarianMealCount,
      otherPreferences,
      consentToStorePersonalData,
    } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Register the authenticated user for the event
    const registration = await registrationService.registerForEvent(
      user.id,
      eventId,
      user,
      {
        fullName,
        whatsappNumber,
        email,
        spouseName,
        childrenUnder7Count,
        childrenOver7Count,
        childrenNamesAndAges,
        vegetarianMealCount,
        nonVegetarianMealCount,
        otherPreferences,
        consentToStorePersonalData,
      }
    );

    return NextResponse.json(
      { 
        registration,
        message: 'Successfully registered for event. Ticket has been generated.' 
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
          : error.message?.includes('past event') ? 400
          : 500 
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
