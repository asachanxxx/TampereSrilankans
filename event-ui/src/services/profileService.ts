/**
 * Profile Service
 * Handles user profile creation and management
 */

import { createClient as createBrowserClient } from '@/../../backend/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { ProfileRepository } from '@/../../backend/repositories/ProfileRepository';
import { deriveDisplayName, determineRole } from '@/lib/auth-utils';
import type { User } from '@supabase/supabase-js';
import type { AppUser } from '@/models/user';

/**
 * Get profile by user ID
 */
export async function getProfileById(userId: string): Promise<AppUser | null> {
  try {
    const supabase = createBrowserClient();
    const profileRepo = new ProfileRepository(supabase);
    return await profileRepo.getProfileById(userId);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Create a new profile from auth user data
 * Uses admin client with service role key to bypass RLS policies
 */
export async function createProfile(authUser: User): Promise<AppUser> {
  // Create admin client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const profileRepo = new ProfileRepository(supabase);
  
  const displayName = deriveDisplayName(authUser);
  const role = determineRole(authUser.email || '');

  return await profileRepo.createProfile(
    authUser.id,
    displayName,
    authUser.email || '',
    role
  );
}

/**
 * Get or create profile (idempotent)
 * This is the core function called after OAuth authentication
 * 
 * Flow:
 * 1. Try to fetch existing profile
 * 2. If not found, create new profile with derived display name and role
 * 3. Return profile
 */
export async function handlePostAuth(authUser: User): Promise<AppUser> {
  if (!authUser.id || !authUser.email) {
    throw new Error('Invalid auth user: missing id or email');
  }

  // Try to get existing profile
  let profile = await getProfileById(authUser.id);

  // If profile exists, return it
  if (profile) {
    return profile;
  }

  // Profile doesn't exist, create it
  console.log('Creating new profile for user:', authUser.email);
  profile = await createProfile(authUser);

  return profile;
}
