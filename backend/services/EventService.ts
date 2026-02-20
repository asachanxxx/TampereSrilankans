import { SupabaseClient } from '@supabase/supabase-js';
import { Event } from '../../event-ui/src/models/event';
import { AppUser } from '../../event-ui/src/models/user';
import { EventRepository } from '../repositories/EventRepository';
import { EventValidator } from '../validators/EventValidator';
import { canCreateEvent, canEditEvent, canDeleteEvent, requireAdmin, canViewEvent } from '../policies/accessControl';

/**
 * EventService - Business logic for event operations
 */
export class EventService {
  private eventRepo: EventRepository;

  constructor(private supabase: SupabaseClient) {
    this.eventRepo = new EventRepository(supabase);
  }

  /**
   * List all public events
   * Available to everyone
   */
  async listPublicEvents(): Promise<Event[]> {
    return this.eventRepo.listPublicEvents();
  }

  /**
   * List all events (admin only)
   */
  async listAllEvents(user: AppUser | null): Promise<Event[]> {
    requireAdmin(user);
    return this.eventRepo.listAllEvents();
  }

  /**
   * Get event details by ID
   * Checks visibility permissions
   */
  async getEventById(eventId: string, user: AppUser | null, isRegistered: boolean = false): Promise<Event | null> {
    const event = await this.eventRepo.getEventById(eventId);
    
    if (!event) return null;

    // Check if user can view this event
    if (!canViewEvent(user, event, isRegistered)) {
      return null; // Or throw AuthorizationError
    }

    return event;
  }

  /**
   * Create a new event (admin only)
   */
  async createEvent(eventData: Partial<Event>, user: AppUser | null): Promise<Event> {
    // Check authorization
    if (!canCreateEvent(user)) {
      throw new Error('Only admins can create events');
    }

    // Validate event data
    EventValidator.validateCreate(eventData);

    // Create event
    return this.eventRepo.createEvent(eventData);
  }

  /**
   * Update an existing event (admin only)
   */
  async updateEvent(eventId: string, updates: Partial<Event>, user: AppUser | null): Promise<Event> {
    // Get existing event
    const existingEvent = await this.eventRepo.getEventById(eventId);
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Check authorization
    if (!canEditEvent(user, existingEvent)) {
      throw new Error('Only admins can edit events');
    }

    // Validate updates
    EventValidator.validateUpdate(updates);

    // Update event
    return this.eventRepo.updateEvent(eventId, updates);
  }

  /**
   * Delete an event (admin only)
   */
  async deleteEvent(eventId: string, user: AppUser | null): Promise<void> {
    // Get existing event
    const existingEvent = await this.eventRepo.getEventById(eventId);
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Check authorization
    if (!canDeleteEvent(user, existingEvent)) {
      throw new Error('Only admins can delete events');
    }

    // Delete event
    await this.eventRepo.deleteEvent(eventId);
  }

  /**
   * Search events by query
   */
  async searchEvents(query: string, user: AppUser | null): Promise<Event[]> {
    // Regular users can only search public events
    const publicOnly = user?.role !== 'admin';
    return this.eventRepo.searchEvents(query, publicOnly);
  }

  /**
   * Filter events by category
   */
  async filterByCategory(categoryId: string, user: AppUser | null): Promise<Event[]> {
    // Validate category ID
    if (!EventValidator.isValidCategoryId(categoryId)) {
      throw new Error('Invalid category ID');
    }

    // Regular users can only see public events
    const publicOnly = user?.role !== 'admin';
    return this.eventRepo.filterByCategory(categoryId, publicOnly);
  }

  /**
   * Get events by status
   */
  async getEventsByStatus(statusId: string, user: AppUser | null): Promise<Event[]> {
    // Validate status ID
    if (!EventValidator.isValidStatusId(statusId)) {
      throw new Error('Invalid status ID');
    }

    // Get all events the user can see
    const events = user?.role === 'admin' 
      ? await this.eventRepo.listAllEvents()
      : await this.eventRepo.listPublicEvents();

    // Filter by status
    return events.filter(event => event.statusId === statusId);
  }
}
