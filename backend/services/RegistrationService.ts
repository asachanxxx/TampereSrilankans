import { SupabaseClient } from '@supabase/supabase-js';
import { Registration, RegistrationFormData } from '../../event-ui/src/models/registration';
import { AppUser } from '../../event-ui/src/models/user';
import { RegistrationRepository } from '../repositories/RegistrationRepository';
import { EventRepository } from '../repositories/EventRepository';
import { RegistrationValidator } from '../validators/RegistrationValidator';
import { requireAuth, canRegisterForEvent, isAdmin } from '../policies/accessControl';
import { TicketService } from './TicketService';
import { Ticket } from '../../event-ui/src/models/ticket';

/**
 * RegistrationService - Business logic for event registrations
 */
export class RegistrationService {
  private registrationRepo: RegistrationRepository;
  private eventRepo: EventRepository;
  private ticketService: TicketService;

  constructor(private supabase: SupabaseClient) {
    this.registrationRepo = new RegistrationRepository(supabase);
    this.eventRepo = new EventRepository(supabase);
    this.ticketService = new TicketService(supabase);
  }

  /**
   * Register user for an event
   * Automatically generates a ticket upon successful registration
   */
  async registerForEvent(userId: string, eventId: string, user: AppUser | null, formData: RegistrationFormData): Promise<Registration> {
    // Must be authenticated
    requireAuth(user);

    // Validate inputs
    RegistrationValidator.validateRegistration(userId, eventId);
    RegistrationValidator.validateRegistrationData(formData);

    // User can only register themselves (unless admin)
    if (user!.id !== userId && !isAdmin(user)) {
      throw new Error('You can only register yourself for events');
    }

    // Check if event exists
    const event = await this.eventRepo.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user can register for this event
    if (!canRegisterForEvent(user, event)) {
      throw new Error('You do not have permission to register for this event');
    }

    // Check if already registered
    const alreadyRegistered = await this.registrationRepo.isUserRegistered(userId, eventId);
    if (alreadyRegistered) {
      throw new Error('You are already registered for this event');
    }

    // Check event status - registration only allowed when event is ongoing
    if (event.statusId !== 'ongoing') {
      throw new Error('Registration is not open for this event');
    }

    // Register user
    const registration = await this.registrationRepo.registerUser(userId, eventId, formData);
    if (!registration) {
      throw new Error('Registration failed - you may already be registered');
    }

    // Generate ticket automatically
    try {
      await this.ticketService.generateTicket(
        userId,
        eventId,
        formData.fullName,
        formData.email
      );
    } catch (error) {
      // If ticket generation fails, we might want to rollback the registration
      // For now, we'll log the error but keep the registration
      console.error('Failed to generate ticket:', error);
    }

    return registration;
  }

  /**
   * Check if user is registered for an event
   */
  async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
    return this.registrationRepo.isUserRegistered(userId, eventId);
  }

  /**
   * Get all registrations for a user
   */
  async getUserRegistrations(userId: string, requestingUser: AppUser | null): Promise<Registration[]> {
    requireAuth(requestingUser);

    // Users can only see their own registrations (unless admin)
    if (requestingUser!.id !== userId && !isAdmin(requestingUser)) {
      throw new Error('You can only view your own registrations');
    }

    return this.registrationRepo.getUserRegistrations(userId);
  }

  /**
   * Get all registrations for an event (admin only)
   */
  async getEventRegistrations(eventId: string, user: AppUser | null): Promise<Registration[]> {
    // Only admins can view event registrations
    if (!isAdmin(user)) {
      throw new Error('Only admins can view event registrations');
    }

    return this.registrationRepo.getEventRegistrations(eventId);
  }

  /**
   * Get registration count for an event
   * Public information
   */
  async getEventRegistrationCount(eventId: string): Promise<number> {
    return this.registrationRepo.getEventRegistrationCount(eventId);
  }

  /**
   * Cancel a registration
   */
  async cancelRegistration(userId: string, eventId: string, requestingUser: AppUser | null): Promise<void> {
    requireAuth(requestingUser);

    // Users can only cancel their own registrations (unless admin)
    if (requestingUser!.id !== userId && !isAdmin(requestingUser)) {
      throw new Error('You can only cancel your own registrations');
    }

    // Check if registered
    const isRegistered = await this.registrationRepo.isUserRegistered(userId, eventId);
    if (!isRegistered) {
      throw new Error('You are not registered for this event');
    }

    // Check event status for cancellation
    const event = await this.eventRepo.getEventById(eventId);
    if (event?.statusId === 'archive') {
      throw new Error('Cannot cancel registration for archived events');
    }

    // Cancel registration
    await this.registrationRepo.cancelRegistration(userId, eventId);

    // Optionally delete the ticket as well
    try {
      const ticket = await this.ticketService.getUserTicketForEvent(userId, eventId);
      if (ticket) {
        // We might want to keep tickets for record keeping
        // For now, we'll keep them
      }
    } catch (error) {
      console.error('Error handling ticket during cancellation:', error);
    }
  }

  /**
   * Register a guest (non-authenticated user) for an event.
   * Creates registration and ticket records with user_id = NULL.
   * Returns the generated ticket so the caller can email the link.
   */
  async registerGuest(eventId: string, formData: RegistrationFormData): Promise<{ registration: Registration; ticket: Ticket }> {
    // Validate inputs
    RegistrationValidator.validateRegistrationData(formData);

    if (!eventId || eventId.trim().length === 0) {
      throw new Error('Event ID is required');
    }

    // Check event exists
    const event = await this.eventRepo.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Only allow registration when event is ongoing
    if (event.statusId !== 'ongoing') {
      throw new Error('Registration is not open for this event');
    }

    // Check duplicate guest registration by email
    const existingByEmail = await this.registrationRepo.isEmailRegisteredForEvent(formData.email, eventId);
    if (existingByEmail) {
      throw new Error('This email address is already registered for this event');
    }

    // Insert registration with user_id = null
    const registration = await this.registrationRepo.registerGuest(eventId, formData);
    if (!registration) {
      throw new Error('Registration failed');
    }

    // Generate ticket with user_id = null
    const ticket = await this.ticketService.generateTicket(
      null,
      eventId,
      formData.fullName,
      formData.email
    );

    return { registration, ticket };
  }
}
