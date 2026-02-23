import { NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { ProfileRepository } from '@backend/repositories/ProfileRepository';

/**
 * GET /api/me
 * Returns the current authenticated user's profile, enriched with
 * email and displayName from the live auth session.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user from the session cookie (server-side — always reliable)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch profile row
    const profileRepo = new ProfileRepository(supabase);
    const profile = await profileRepo.getProfileById(authUser.id);

    if (!profile) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Enrich with real email + displayName from the auth session
    const enriched = {
      ...profile,
      email: authUser.email || profile.email,
      displayName:
        profile.displayName ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email ||
        'User',
    };

    return NextResponse.json({ user: enriched }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/me error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
