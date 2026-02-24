import { SupabaseClient } from '@supabase/supabase-js';
import { AppUser } from '../../event-ui/src/models/user';
import { Event, EventStatusId } from '../../event-ui/src/models/event';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { EventRepository } from '../repositories/EventRepository';
import { RegistrationRepository } from '../repositories/RegistrationRepository';
import { TicketRepository } from '../repositories/TicketRepository';
import { requireAdmin } from '../policies/accessControl';

/**
 * AdminService - Admin-specific operations
 */
export class AdminService {
  private profileRepo: ProfileRepository;
  private eventRepo: EventRepository;
  private registrationRepo: RegistrationRepository;
  private ticketRepo: TicketRepository;

  constructor(private supabase: SupabaseClient) {
    this.profileRepo = new ProfileRepository(supabase);
    this.eventRepo = new EventRepository(supabase);
    this.registrationRepo = new RegistrationRepository(supabase);
    this.ticketRepo = new TicketRepository(supabase);
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(user: AppUser | null): Promise<AppUser[]> {
    requireAdmin(user);
    return this.profileRepo.getAllProfiles();
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string, requestingUser: AppUser | null): Promise<AppUser | null> {
    requireAdmin(requestingUser);
    return this.profileRepo.getProfileById(userId);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    userId: string,
    newRole: 'user' | 'member' | 'moderator' | 'organizer' | 'admin',
    requestingUser: AppUser | null
  ): Promise<AppUser> {
    requireAdmin(requestingUser);

    // Prevent admin from demoting themselves
    if (userId === requestingUser!.id && newRole !== 'admin') {
      throw new Error('You cannot change your own role');
    }

    return this.profileRepo.updateProfile(userId, { role: newRole });
  }

  /**
   * Update user profile (name and/or role) - admin only
   */
  async updateUserProfile(
    userId: string,
    updates: { displayName?: string; role?: 'user' | 'member' | 'moderator' | 'organizer' | 'admin' },
    requestingUser: AppUser | null
  ): Promise<AppUser> {
    requireAdmin(requestingUser);

    if (updates.role && userId === requestingUser!.id && updates.role !== 'admin') {
      throw new Error('You cannot change your own role');
    }

    return this.profileRepo.updateProfile(userId, updates);
  }

  /**
   * Get all events with statistics (admin only)
   */
  async getAllEventsWithStats(user: AppUser | null): Promise<Array<Event & { registrationCount: number; ticketCount: number }>> {
    requireAdmin(user);

    const events = await this.eventRepo.listAllEvents();

    // Get stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await this.registrationRepo.getEventRegistrationCount(event.id);
        const tickets = await this.ticketRepo.getEventTickets(event.id);
        
        return {
          ...event,
          registrationCount,
          ticketCount: tickets.length,
        };
      })
    );

    return eventsWithStats;
  }

  /**
   * Get event statistics (admin only)
   */
  async getEventStatistics(eventId: string, user: AppUser | null): Promise<{
    event: Event;
    registrationCount: number;
    ticketCount: number;
    registrations: any[];
  }> {
    requireAdmin(user);

    const event = await this.eventRepo.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const registrationCount = await this.registrationRepo.getEventRegistrationCount(eventId);
    const registrations = await this.registrationRepo.getEventRegistrations(eventId);
    const tickets = await this.ticketRepo.getEventTickets(eventId);

    return {
      event,
      registrationCount,
      ticketCount: tickets.length,
      registrations,
    };
  }

  /**
   * Get platform statistics (admin only)
   */
  async getPlatformStatistics(user: AppUser | null): Promise<{
    totalEvents: number;
    totalUsers: number;
    totalRegistrations: number;
    totalTickets: number;
    eventsByStatus: Record<string, number>;
    eventsByCategory: Record<string, number>;
  }> {
    requireAdmin(user);

    const events = await this.eventRepo.listAllEvents();
    const users = await this.profileRepo.getAllProfiles();

    // Count events by status and category
    const eventsByStatus: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};

    events.forEach((event) => {
      eventsByStatus[event.statusId] = (eventsByStatus[event.statusId] || 0) + 1;
      eventsByCategory[event.categoryId] = (eventsByCategory[event.categoryId] || 0) + 1;
    });

    // Count total registrations and tickets across all events
    let totalRegistrations = 0;
    let totalTickets = 0;

    for (const event of events) {
      const regCount = await this.registrationRepo.getEventRegistrationCount(event.id);
      const tickets = await this.ticketRepo.getEventTickets(event.id);
      totalRegistrations += regCount;
      totalTickets += tickets.length;
    }

    return {
      totalEvents: events.length,
      totalUsers: users.length,
      totalRegistrations,
      totalTickets,
      eventsByStatus,
      eventsByCategory,
    };
  }

  /**
   * Delete user (admin only)
   * This will cascade delete their registrations and tickets
   */
  async deleteUser(userId: string, requestingUser: AppUser | null): Promise<void> {
    requireAdmin(requestingUser);

    // Prevent admin from deleting themselves
    if (userId === requestingUser!.id) {
      throw new Error('You cannot delete yourself');
    }

    // Delete profile (this should cascade to registrations/tickets via DB constraints)
    await this.profileRepo.deleteProfile(userId);
  }

  /**
   * Bulk update event status (admin only)
   */
  async bulkUpdateEventStatus(
    eventIds: string[],
    newStatusId: EventStatusId,
    user: AppUser | null
  ): Promise<void> {
    requireAdmin(user);

    // Update each event
    await Promise.all(
      eventIds.map((eventId) =>
        this.eventRepo.updateEvent(eventId, { statusId: newStatusId })
      )
    );
  }
}
