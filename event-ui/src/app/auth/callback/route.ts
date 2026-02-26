/**
 * OAuth Callback Handler
 * Handles the OAuth redirect after Google/Facebook authentication
 */

import { createClient } from '@backend/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { handlePostAuth } from '@/services/profileService';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🟢 CALLBACK INVOKED:', {
    fullUrl: requestUrl.toString(),
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    hasCode: !!code,
    codeLength: code?.length,
    hasError: !!error
  });

  console.log('🌐 SITE URL RESOLUTION:', {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '⚠️ NOT SET',
    requestOrigin: requestUrl.origin,
    resolvedSiteUrl: siteUrl,
    usingEnvVar: !!process.env.NEXT_PUBLIC_SITE_URL
  });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${siteUrl}/auth?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(
      `${siteUrl}/auth?error=No code provided`
    );
  }

  try {
    // Use proper server client with cookie handling for PKCE flow
    const supabase = await createClient();
    
    // Debug: Check what cookies we have
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('🍪 AVAILABLE COOKIES:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      supabaseCookies: allCookies.filter(c => c.name.includes('supabase')).map(c => ({
        name: c.name,
        valueLength: c.value?.length
      }))
    });
    
    console.log('🔵 SUPABASE CLIENT CREATED with proper cookie handling');
    console.log('🟡 EXCHANGING CODE FOR SESSION:', {
      codeFirst10: code?.substring(0, 10)
    });

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    console.log('🟣 SESSION EXCHANGE RESULT:', {
      success: !sessionError && !!session,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      errorStatus: sessionError?.status,
      errorMessage: sessionError?.message,
      errorCode: (sessionError as any)?.code,
      fullError: sessionError
    });

    if (sessionError || !session?.user) {
      console.error('❌ Session exchange error:', sessionError);
      return NextResponse.redirect(
        `${siteUrl}/auth?error=${encodeURIComponent(sessionError?.message || 'Failed to establish session')}`
      );
    }

    console.log('✅ SESSION ESTABLISHED, creating profile...');

    // Create or fetch user profile
    const profile = await handlePostAuth(session.user);

    console.log('✅ PROFILE READY:', {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      displayName: profile.display_name
    });

    // Redirect based on role
    let redirectTo = '/me';
    if (profile.role === 'admin') {
      redirectTo = '/admin';
    } else if (profile.role === 'organizer' || profile.role === 'moderator') {
      redirectTo = '/admin/event-management';
    }
    console.log('🎯 FINAL REDIRECT:', {
      relativePath: redirectTo,
      fullUrl: `${siteUrl}${redirectTo}`,
      siteUrl
    });
    return NextResponse.redirect(`${siteUrl}${redirectTo}`);

  } catch (err) {
    console.error('❌ CALLBACK EXCEPTION:', {
      error: err,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      errorStack: err instanceof Error ? err.stack : undefined
    });
    return NextResponse.redirect(
      `${siteUrl}/auth?error=${encodeURIComponent(err instanceof Error ? err.message : 'Authentication failed')}`
    );
  }
}
