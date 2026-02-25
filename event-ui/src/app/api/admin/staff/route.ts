import { NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { ProfileRepository } from '@backend/repositories/ProfileRepository';
import { requireOrganizer } from '@/lib/auth';

/**
 * GET /api/admin/staff
 * Returns all profiles with role organizer / moderator / admin.
 * Used to populate ticket assignment dropdowns.
 * Requires organizer role or higher.
 */
export async function GET() {
  try {
    await requireOrganizer();

    const supabase = createAdminClient();
    const repo = new ProfileRepository(supabase);
    const staff = await repo.getStaffProfiles();

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/staff error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch staff' }, { status });
  }
}
