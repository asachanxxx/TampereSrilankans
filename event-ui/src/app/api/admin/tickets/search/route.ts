import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/admin/tickets/search?q=<query>
 * Full-text search across tickets: name, email, ticket number, phone.
 * Requires organizer / moderator / admin role.
 * Minimum 2 characters; results capped at 20.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAuth();
    const q = request.nextUrl.searchParams.get('q') ?? '';

    if (q.length < 2) {
      return NextResponse.json({ tickets: [] });
    }

    const supabase = createAdminClient();
    const ticketService = new TicketService(supabase);
    const tickets = await ticketService.searchTickets(q, actor);

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('GET /api/admin/tickets/search error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      400;
    return NextResponse.json({ error: error.message || 'Search failed' }, { status });
  }
}
