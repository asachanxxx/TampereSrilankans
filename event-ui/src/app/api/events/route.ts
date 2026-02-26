import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { EventService } from '@backend/services/EventService';
import { getCurrentUser } from '../../../lib/auth';

/**
 * GET /api/events
 * List all events (public for regular users, all for admins)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/events - Supabase config:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '⚠️ NOT SET',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    const supabase = await createClient();
    const eventService = new EventService(supabase);
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let events;

    if (query) {
      // Search events
      events = await eventService.searchEvents(query, user);
    } else if (category) {
      // Filter by category
      events = await eventService.filterByCategory(category, user);
    } else if (status) {
      // Filter by status
      events = await eventService.getEventsByStatus(status, user);
    } else if (user?.role === 'admin') {
      // Admin sees all events
      events = await eventService.listAllEvents(user);
    } else {
      // Regular users see public events
      events = await eventService.listPublicEvents();
    }

    console.log('✅ GET /api/events result:', { count: events?.length ?? 0 });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/events error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: error.message?.includes('authorized') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const eventService = new EventService(supabase);
    const user = await getCurrentUser();

    const body = await request.json();

    const event = await eventService.createEvent(body, user);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: error.message?.includes('admin') ? 403 : error.message?.includes('Validation') ? 400 : 500 }
    );
  }
}
