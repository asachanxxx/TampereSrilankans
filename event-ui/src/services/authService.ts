/**
 * Authentication Service
 * Handles OAuth authentication with Google and Facebook
 */

import { createClient } from '@backend/lib/supabase/client';
import type { Provider } from '@supabase/supabase-js';

const supabase = createClient();

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  
  console.log('🔵 GOOGLE OAUTH CONFIG:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    redirectTo,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    expectedCallbackFormat: 'http://localhost:3000/auth/callback'
  });
  
  return await supabase.auth.signInWithOAuth({
    provider: 'google' as Provider,
    options: {
      redirectTo,
    },
  });
}

/**
 * Sign in with Facebook OAuth
 */
export async function signInWithFacebook() {
  return await supabase.auth.signInWithOAuth({
    provider: 'facebook' as Provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return await supabase.auth.signOut();
}

/**
 * Get the current session
 */
export async function getSession() {
  return await supabase.auth.getSession();
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
