/**
 * Server-side Google OAuth Initiation
 */

import { createClient } from '@/../../backend/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('❌ OAuth initiation error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth?error=${encodeURIComponent(error.message)}`);
  }

  console.log('🚀 OAUTH INITIATED:', {
    url: data.url,
    provider: 'google'
  });

  // Redirect to Google OAuth
  return NextResponse.redirect(data.url);
}
