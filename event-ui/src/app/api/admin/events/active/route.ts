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

    // Fetch ticket stage counts for each active event in a single query
    const activeEventIds = activeEvents.map((e) => e.id);
    const ticketStatsMap: Record<string, { total: number; assigned: number; paymentSent: number; paidOrBoarded: number }> = {};

    if (activeEventIds.length > 0) {
      const { data: ticketRows } = await supabase
        .from('tickets')
        .select('event_id, assigned_to_id, payment_status, boarding_status')
        .in('event_id', activeEventIds);

      for (const t of ticketRows ?? []) {
        if (!ticketStatsMap[t.event_id]) {
          ticketStatsMap[t.event_id] = { total: 0, assigned: 0, paymentSent: 0, paidOrBoarded: 0 };
        }
        const s = ticketStatsMap[t.event_id];
        s.total++;
        if (t.boarding_status === 'boarded' || t.payment_status === 'paid') {
          s.paidOrBoarded++;
        } else if (t.payment_status === 'payment_sent') {
          s.paymentSent++;
        } else if (t.assigned_to_id !== null) {
          s.assigned++;
        }
      }
    }

    const eventsWithStats = activeEvents.map((e) => ({
      ...e,
      ticketStats: ticketStatsMap[e.id] ?? { total: 0, assigned: 0, paymentSent: 0, paidOrBoarded: 0 },
    }));

    return NextResponse.json({ events: eventsWithStats }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/active error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch active events' }, { status });
  }
}
