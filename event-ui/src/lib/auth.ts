import { createClient } from '@backend/lib/supabase/server';
import { AppUser } from '../models/user';
import { ProfileRepository } from '@backend/repositories/ProfileRepository';

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  // Get profile from database
  const profileRepo = new ProfileRepository(supabase);
  const profile = await profileRepo.getProfileById(authUser.id);

  return profile;
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require admin role - throw error if not admin
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}
