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
 * Uses admin client to bypass RLS policies
 * 
 * Flow:
 * 1. Try to fetch existing profile with admin client
 * 2. If not found, create new profile with derived display name and role
 * 3. Handle duplicate key errors gracefully
 * 4. Return profile
 */
export async function handlePostAuth(authUser: User): Promise<AppUser> {
  if (!authUser.id || !authUser.email) {
    throw new Error('Invalid auth user: missing id or email');
  }

  // Create admin client with service role key to bypass RLS
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

  // Try to get existing profile using admin client
  try {
    const profile = await profileRepo.getProfileById(authUser.id);
    if (profile) {
      console.log('✅ Profile found for user:', authUser.email);
      return profile;
    }
  } catch (error) {
    console.log('⚠️  Error fetching profile, will try to create:', error);
  }

  // Profile doesn't exist, create it
  console.log('Creating new profile for user:', authUser.email);
  
  try {
    const displayName = deriveDisplayName(authUser);
    const role = determineRole(authUser.email || '');
    
    const profile = await profileRepo.createProfile(
      authUser.id,
      displayName,
      authUser.email || '',
      role
    );
    
    console.log('✅ Profile created successfully');
    return profile;
  } catch (error: any) {
    // Handle duplicate key error - profile already exists
    if (error?.code === '23505') {
      console.log('Profile already exists (duplicate key), fetching it...');
      const profile = await profileRepo.getProfileById(authUser.id);
      if (profile) {
        return profile;
      }
    }
    throw error;
  }
}
