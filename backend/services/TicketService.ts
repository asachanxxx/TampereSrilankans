import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket } from '../../event-ui/src/models/ticket';
import { AppUser } from '../../event-ui/src/models/user';
import { TicketRepository } from '../repositories/TicketRepository';
import { RegistrationValidator } from '../validators/RegistrationValidator';
import { requireAuth, isAdmin } from '../policies/accessControl';

/**
 * TicketService - Business logic for ticket operations
 */
export class TicketService {
  private ticketRepo: TicketRepository;

  constructor(private supabase: SupabaseClient) {
    this.ticketRepo = new TicketRepository(supabase);
  }

  /**
   * Generate a ticket for a user
   * Typically called automatically after registration
   */
  async generateTicket(
    userId: string | null,
    eventId: string,
    issuedToName: string,
    issuedToEmail: string
  ): Promise<Ticket> {
    // Validate inputs
    RegistrationValidator.validateTicketGeneration(userId, eventId, issuedToName, issuedToEmail);

    // Check if ticket already exists for this user/event
    const existingTicket = userId
      ? await this.ticketRepo.getUserTicketForEvent(userId, eventId)
      : await this.ticketRepo.getGuestTicketForEvent(issuedToEmail, eventId);
    if (existingTicket) {
      // Return existing ticket instead of creating duplicate
      return existingTicket;
    }

    // Create new ticket
    return this.ticketRepo.createTicket(userId, eventId, issuedToName, issuedToEmail);
  }

  /**
   * Get ticket by ticket number
   * Anyone with the ticket number can view it (for verification purposes)
   */
  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    if (!ticketNumber || ticketNumber.trim().length === 0) {
      throw new Error('Ticket number is required');
    }

    return this.ticketRepo.getTicketByNumber(ticketNumber);
  }

  /**
   * Get user's ticket for a specific event
   */
  async getUserTicketForEvent(
    userId: string,
    eventId: string,
    requestingUser?: AppUser | null
  ): Promise<Ticket | null> {
    // If requesting user provided, check authorization
    if (requestingUser !== undefined) {
      requireAuth(requestingUser);

      // Users can only see their own tickets (unless admin)
      if (requestingUser!.id !== userId && !isAdmin(requestingUser)) {
        throw new Error('You can only view your own tickets');
      }
    }

    return this.ticketRepo.getUserTicketForEvent(userId, eventId);
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string, requestingUser: AppUser | null): Promise<Ticket[]> {
    requireAuth(requestingUser);

    // Users can only see their own tickets (unless admin)
    if (requestingUser!.id !== userId && !isAdmin(requestingUser)) {
      throw new Error('You can only view your own tickets');
    }

    return this.ticketRepo.getUserTickets(userId);
  }

  /**
   * Get all tickets for an event (admin only)
   */
  async getEventTickets(eventId: string, user: AppUser | null): Promise<Ticket[]> {
    // Only admins can view all event tickets
    if (!isAdmin(user)) {
      throw new Error('Only admins can view event tickets');
    }

    return this.ticketRepo.getEventTickets(eventId);
  }

  /**
   * Verify ticket validity
   * Returns ticket if valid, null if invalid
   */
  async verifyTicket(ticketNumber: string): Promise<{ valid: boolean; ticket: Ticket | null }> {
    const ticket = await this.getTicketByNumber(ticketNumber);
    
    if (!ticket) {
      return { valid: false, ticket: null };
    }

    // Ticket exists and is valid
    return { valid: true, ticket };
  }

  /**
   * Generate unique ticket number
   * Exposed for testing/utility purposes
   */
  generateTicketNumber(): string {
    return this.ticketRepo.generateTicketNumber();
  }
}
