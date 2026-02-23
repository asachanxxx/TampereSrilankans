/**
 * Auth Utility Functions
 * Helper functions for authentication and profile management
 */

import type { User } from '@supabase/supabase-js';

/**
 * Derive a display name from OAuth user data
 * Priority: full_name -> name -> email prefix
 */
export function deriveDisplayName(authUser: User): string {
  // Try full_name from user_metadata (Google, Facebook)
  if (authUser.user_metadata?.full_name) {
    const name = authUser.user_metadata.full_name.trim();
    if (name.length >= 2) return name;
  }

  // Try name from user_metadata
  if (authUser.user_metadata?.name) {
    const name = authUser.user_metadata.name.trim();
    if (name.length >= 2) return name;
  }

  // Fallback to email prefix (before @)
  if (authUser.email) {
    const emailPrefix = authUser.email.split('@')[0];
    const cleanName = emailPrefix.replace(/[._-]/g, ' ').trim();
    if (cleanName.length >= 2) return cleanName;
  }

  // Ultimate fallback
  return 'User';
}

/**
 * Check if email is in admin allowlist
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Determine role based on admin allowlist
 */
export function determineRole(email: string): 'user' | 'admin' {
  return isAdminEmail(email) ? 'admin' : 'user';
}
