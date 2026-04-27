import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { EventRepository } from '@backend/repositories/EventRepository';

/**
 * GET /api/admin/board-stats?eventId=<id>
 * Returns live boarding statistics for a specific event.
 * Requires admin role.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Return event list when no eventId provided
    if (!eventId) {
      const repo = new EventRepository(supabase);
      const allEvents = await repo.listAllEvents();
      const events = allEvents
        .filter((e) => e.statusId === 'ongoing' || e.statusId === 'ticket_closed' || e.statusId === 'upcoming')
        .map((e) => ({ id: e.id, title: e.title, statusId: e.statusId, eventDate: e.eventDate }));
      return NextResponse.json({ events });
    }

    // Fetch all tickets for this event
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, issued_to_name, ticket_number, payment_status, boarding_status, boarded_at, boarded_by_id, user_id, issued_to_email')
      .eq('event_id', eventId)
      .order('boarded_at', { ascending: false });

    if (ticketsError) throw ticketsError;

    const all = tickets ?? [];
    const boarded = all.filter((t) => t.boarding_status === 'boarded');
    const paid = all.filter((t) => t.payment_status === 'paid' && t.boarding_status !== 'boarded');
    const awaitingPayment = all.filter((t) => t.payment_status !== 'paid' && t.boarding_status !== 'boarded');

    // Meal counts from registrations of ALL registrants (not just boarded)
    const { data: regRows } = await supabase
      .from('event_registrations')
      .select('vegetarian_meal_count, non_vegetarian_meal_count, kids_meal_count, user_id, email')
      .eq('event_id', eventId);

    // Build lookup by user_id and email
    const regByUserId = new Map<string, any>();
    const regByEmail = new Map<string, any>();
    for (const r of regRows ?? []) {
      if (r.user_id) regByUserId.set(r.user_id, r);
      if (r.email) regByEmail.set(r.email.toLowerCase(), r);
    }

    // Sum meals only for boarded tickets
    let vegMeals = 0, nonVegMeals = 0, kidsMeals = 0;
    for (const t of boarded) {
      const reg = (t.user_id ? regByUserId.get(t.user_id) : undefined)
        ?? regByEmail.get((t.issued_to_email ?? '').toLowerCase());
      if (reg) {
        vegMeals += reg.vegetarian_meal_count ?? 0;
        nonVegMeals += reg.non_vegetarian_meal_count ?? 0;
        kidsMeals += reg.kids_meal_count ?? 0;
      }
    }

    // Recent check-ins (last 10 boarded, already sorted desc by boarded_at)
    const recentCheckIns = boarded.slice(0, 10).map((t) => ({
      ticketNumber: t.ticket_number,
      name: t.issued_to_name,
      boardedAt: t.boarded_at,
    }));

    // Pending arrival — paid but not boarded
    const pendingArrival = paid.map((t) => ({
      ticketNumber: t.ticket_number,
      name: t.issued_to_name,
    }));

    return NextResponse.json({
      summary: {
        total: all.length,
        boarded: boarded.length,
        pendingArrival: paid.length,
        awaitingPayment: awaitingPayment.length,
        completionPct: all.length > 0 ? Math.round((boarded.length / all.length) * 100) : 0,
      },
      meals: { vegMeals, nonVegMeals, kidsMeals },
      recentCheckIns,
      pendingArrival,
    });
  } catch (error: any) {
    console.error('GET /api/admin/board-stats error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('Admin') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status });
  }
}
