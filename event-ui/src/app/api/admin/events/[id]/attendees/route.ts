import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { RegistrationRepository } from '@backend/repositories/RegistrationRepository';
import { requireOrganizer } from '@/lib/auth';

/**
 * GET /api/admin/events/[id]/attendees
 * Return all registrations for a specific event.
 * Requires organizer / moderator / admin role.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireOrganizer();

    // Use admin client to bypass RLS (staff reading all registrations)
    const supabase = createAdminClient();
    const repo = new RegistrationRepository(supabase);

    const registrations = await repo.getEventRegistrations(params.id);

    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/events/[id]/attendees error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 :
      500;
    return NextResponse.json({ error: error.message || 'Failed to fetch attendees' }, { status });
  }
}
