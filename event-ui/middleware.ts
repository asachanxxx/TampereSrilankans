/**
 * Route Protection Middleware
 * Protects /me and /admin routes with authentication and authorization
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/me');
  const isApiAdminRoute = pathname.startsWith('/api/admin');

  // Protect user routes (/me/*)
  if (isUserRoute) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    // Authenticated user can access /me routes
    return response;
  }

  // Protect admin routes (/admin/*, /api/admin/*)
  if (isAdminRoute || isApiAdminRoute) {
    if (!session?.user) {
      // Not authenticated, redirect to auth page
      if (isApiAdminRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Check if user has admin role
    try {
      // Import ProfileRepository dynamically to avoid build issues
      const { ProfileRepository } = await import('../backend/repositories/ProfileRepository');
      const profileRepo = new ProfileRepository(supabase);
      const profile = await profileRepo.getProfileById(session.user.id);

      if (!profile || profile.role !== 'admin') {
        // Authenticated but not admin
        if (isApiAdminRoute) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/not-authorized', request.url));
      }

      // Admin user can proceed
      return response;
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (isApiAdminRoute) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/me/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
