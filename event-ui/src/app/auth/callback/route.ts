/**
 * OAuth Callback Handler
 * Handles the OAuth redirect after Google/Facebook authentication
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { handlePostAuth } from '@/services/profileService';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=No code provided`
    );
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session?.user) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent(sessionError?.message || 'Failed to establish session')}`
      );
    }

    // Create or fetch user profile
    const profile = await handlePostAuth(session.user);

    // Redirect based on role
    const redirectTo = profile.role === 'admin' ? '/admin' : '/me';
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);

  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(err instanceof Error ? err.message : 'Authentication failed')}`
    );
  }
}
