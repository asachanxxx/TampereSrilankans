import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in browser/client components
 * Uses the anon public key which is safe to expose
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
