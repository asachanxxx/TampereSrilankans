import { AppUser } from '../../event-ui/src/models/user';
import { Event } from '../../event-ui/src/models/event';

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
 * Check if user is authenticated (not guest)
 */
export function isAuthenticated(user: AppUser | null): boolean {
  return user !== null && user.role !== 'guest';
}

/**
 * Check if user can edit an event
 * Only admins can edit events
 */
export function canEditEvent(user: AppUser | null, event?: Event): boolean {
  return isAdmin(user);
}

/**
 * Check if user can delete an event
 * Only admins can delete events
 */
export function canDeleteEvent(user: AppUser | null, event?: Event): boolean {
  return isAdmin(user);
}

/**
 * Check if user can create an event
 * Only admins can create events
 */
export function canCreateEvent(user: AppUser | null): boolean {
  return isAdmin(user);
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
 * Require authenticated user, throw error if not authenticated
 */
export function requireAuth(user: AppUser | null): void {
  if (!isAuthenticated(user)) {
    throw new AuthorizationError('Authentication required');
  }
}
