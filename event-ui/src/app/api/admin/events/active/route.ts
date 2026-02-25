import { NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { EventRepository } from '@backend/repositories/EventRepository';
import { requireOrganizer } from '@/lib/auth';

/**
 * GET /api/admin/events/active
 * Returns events with status 'ongoing' or 'ticket_closed'.
 * Used to populate the event picker in the event-management workspace.
 * Requires organizer role or higher.
 */
export async function GET() {
  try {
    await requireOrganizer();

    const supabase = createAdminClient();
    const repo = new EventRepository(supabase);

    // Fetch all events then filter for active statuses
    const allEvents = await repo.listAllEvents();
    const activeEvents = allEvents.filter(
      (e) => e.statusId === 'ongoing' || e.statusId === 'ticket_closed'
    );

    return NextResponse.json({ events: activeEvents }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/active error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch active events' }, { status });
  }
}
