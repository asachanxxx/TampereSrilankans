import { SupabaseClient } from '@supabase/supabase-js';
import { AppUser, UserRole } from '../../event-ui/src/models/user';
import { Event } from '../../event-ui/src/models/event';
import { PermissionsRepository } from '../repositories/PermissionsRepository';

// =====================================================
// DB-driven permission cache (5 min TTL)
// =====================================================

/** role → Set<permissionId> */
let _permCache: Map<string, Set<string>> | null = null;
let _cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Load permissions from DB into the module-level cache.
 * Automatically called by hasPermission() when the cache is stale.
 */
async function loadPermissionCache(supabase: SupabaseClient): Promise<void> {
  const repo = new PermissionsRepository(supabase);
  const map = await repo.getAllRolePermissions();
  _permCache = new Map(Object.entries(map).map(([role, perms]) => [role, new Set(perms)]));
  _cacheLoadedAt = Date.now();
}

/**
 * Check whether a role holds a specific permission.
 * Uses an in-memory cache (5-min TTL) so DB calls are infrequent.
 */
export async function hasPermission(
  supabase: SupabaseClient,
  role: UserRole | null | undefined,
  permission: string
): Promise<boolean> {
  if (!role) return false;
  if (!_permCache || Date.now() - _cacheLoadedAt > CACHE_TTL_MS) {
    await loadPermissionCache(supabase);
  }
  return _permCache?.get(role)?.has(permission) ?? false;
}

/**
 * Invalidate the permission cache – call this after any grant/revoke operation.
 */
export function invalidatePermissionCache(): void {
  _permCache = null;
  _cacheLoadedAt = 0;
}

/**
 * Access control policies - Business logic for authorization
 * These are separate from RLS policies and used in the service layer
 */

/**
 * Check if user is an admin
 */
export function isAdmin(user: AppUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user is a moderator (or higher)
 */
export function isModerator(user: AppUser | null): boolean {
  return user?.role === 'moderator' || user?.role === 'admin';
}

/**
 * Check if user is an organizer (or higher)
 */
export function isOrganizer(user: AppUser | null): boolean {
  return user?.role === 'organizer' || user?.role === 'moderator' || user?.role === 'admin';
}

/**
 * Check if user is a verified member (or higher)
 */
export function isMember(user: AppUser | null): boolean {
  return user?.role === 'member' || user?.role === 'organizer' || user?.role === 'moderator' || user?.role === 'admin';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: AppUser | null): boolean {
  return user !== null;
}

/**
 * Check if user can edit an event
 * Admins, moderators, and organizers can edit events
 */
export function canEditEvent(user: AppUser | null, event?: Event): boolean {
  return isOrganizer(user);
}

/**
 * Check if user can delete an event
 * Only admins and moderators can delete events
 */
export function canDeleteEvent(user: AppUser | null, event?: Event): boolean {
  return isModerator(user);
}

/**
 * Check if user can create an event
 * Admins, moderators, and organizers can create events
 */
export function canCreateEvent(user: AppUser | null): boolean {
  return isOrganizer(user);
}

/**
 * Check if user can view a private event
 * Admins can view all events, regular users can only view public events
 * unless they are registered for the private event
 */
export function canViewEvent(user: AppUser | null, event: Event, isRegistered: boolean = false): boolean {
  // Public events are visible to everyone
  if (event.visibilityId === 'public') {
    return true;
  }

  // Private events
  if (event.visibilityId === 'private') {
    // Admins can view all events
    if (isAdmin(user)) {
      return true;
    }

    // Registered users can view private events they're registered for
    if (isAuthenticated(user) && isRegistered) {
      return true;
    }

    return false;
  }

  // Default: allow viewing
  return true;
}

/**
 * Check if user can register for an event
 * User must be authenticated and event must be public or user must have access
 */
export function canRegisterForEvent(user: AppUser | null, event: Event): boolean {
  // Must be authenticated
  if (!isAuthenticated(user)) {
    return false;
  }

  // Admins can always register
  if (isAdmin(user)) {
    return true;
  }

  // Can only register for public events (unless admin)
  // Private events would need special invitation logic
  return event.visibilityId === 'public';
}

/**
 * Check if user can view event registrations
 * Only admins can view event registrations
 */
export function canViewEventRegistrations(user: AppUser | null): boolean {
  return isAdmin(user);
}

/**
 * Check if user can view event tickets
 * Admins can view all tickets, regular users can only view their own
 */
export function canViewEventTickets(user: AppUser | null, ticketUserId?: string): boolean {
  if (isAdmin(user)) {
    return true;
  }

  if (ticketUserId && user?.id === ticketUserId) {
    return true;
  }

  return false;
}

/**
 * Check if user can manage ticket lifecycle
 * (assign, send payment details, confirm payment).
 * Organizers, moderators, and admins can manage tickets.
 */
export function canManageTickets(user: AppUser | null): boolean {
  return isOrganizer(user);
}

/**
 * Check if user can board tickets (check-in attendees at event entrance).
 * Organizers, moderators, and admins can board tickets.
 */
export function canBoardTickets(user: AppUser | null): boolean {
  return isOrganizer(user);
}

/**
 * Check if user can manage user roles
 * Only admins can manage roles
 */
export function canManageRoles(user: AppUser | null): boolean {
  return isAdmin(user);
}

/**
 * Authorization error
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Require admin role, throw error if not admin
 */
export function requireAdmin(user: AppUser | null): void {
  if (!isAdmin(user)) {
    throw new AuthorizationError('Admin access required');
  }
}

/**
 * Require organizer role (or higher), throw error if not met.
 * Organizer, moderator, and admin all pass this check.
 */
export function requireOrganizer(user: AppUser | null): void {
  if (!isOrganizer(user)) {
    throw new AuthorizationError('Organizer access required');
  }
}

/**
 * Require authenticated user, throw error if not authenticated
 */
export function requireAuth(user: AppUser | null): void {
  if (!isAuthenticated(user)) {
    throw new AuthorizationError('Authentication required');
  }
}
