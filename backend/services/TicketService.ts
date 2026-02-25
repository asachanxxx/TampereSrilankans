import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket } from '../../event-ui/src/models/ticket';
import { EventPaymentInstructions } from '../../event-ui/src/models/event';
import { AppUser } from '../../event-ui/src/models/user';
import { TicketRepository } from '../repositories/TicketRepository';
import { RegistrationValidator } from '../validators/RegistrationValidator';
import { requireAuth, isAdmin, isOrganizer, AuthorizationError } from '../policies/accessControl';

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

  // -------------------------------------------------------
  // Lifecycle actions (organizer / moderator / admin only)
  // -------------------------------------------------------

  /**
   * Assign a ticket to a staff member.
   * The assigned staff member is responsible for processing the ticket
   * (sending payment details, confirming payment, etc.).
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - Ticket must not already be boarded.
   */
  async assignTicket(
    ticketId: string,
    assigneeId: string,
    actor: AppUser | null
  ): Promise<Ticket> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can assign tickets');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.boardingStatus === 'boarded') {
      throw new Error('Cannot reassign a ticket that has already been boarded');
    }

    return this.ticketRepo.assignTicket(ticketId, assigneeId);
  }

  /**
   * Mark payment details as sent to the attendee.
   * The actual message is sent manually by the staff member (via WhatsApp, email, etc.).
   * Returns both the updated ticket and a ready-to-copy payment message string.
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - Ticket must be assigned (assigned_to_id must be set).
   *  - payment_status must be NULL (not already actioned).
   */
  async markPaymentSent(
    ticketId: string,
    actor: AppUser | null
  ): Promise<{ ticket: Ticket; paymentMessage: string }> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can send payment details');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (!ticket.assignedToId) {
      throw new Error('Ticket must be assigned to a staff member before payment details can be sent');
    }
    if (ticket.paymentStatus !== null) {
      throw new Error(`Payment details have already been ${ticket.paymentStatus === 'paid' ? 'confirmed as paid' : 'sent'}`);
    }

    // Fetch event payment instructions
    const { data: eventRow, error: eventError } = await this.supabase
      .from('events')
      .select('title, payment_instructions')
      .eq('id', ticket.eventId)
      .single();
    if (eventError) throw eventError;

    const updatedTicket = await this.ticketRepo.markPaymentSent(ticketId);
    const paymentMessage = this.buildPaymentMessage(
      updatedTicket,
      eventRow?.title ?? 'Event',
      eventRow?.payment_instructions ?? null
    );

    return { ticket: updatedTicket, paymentMessage };
  }

  /**
   * Confirm that the attendee has paid (manual confirmation by staff).
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - payment_status must be 'payment_sent'.
   */
  async markPaid(
    ticketId: string,
    actor: AppUser | null
  ): Promise<Ticket> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can confirm payment');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.paymentStatus !== 'payment_sent') {
      throw new Error(
        ticket.paymentStatus === 'paid'
          ? 'Ticket is already marked as paid'
          : 'Payment details must be sent before confirming payment'
      );
    }

    return this.ticketRepo.markPaid(ticketId);
  }

  /**
   * Mark a ticket as boarded (attendee checked in at event entrance).
   * Typically triggered when a staff member scans the QR code.
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - payment_status must be 'paid'.
   */
  async markBoarded(
    ticketId: string,
    boardedById: string,
    actor: AppUser | null
  ): Promise<Ticket> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can board tickets');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.boardingStatus === 'boarded') {
      throw new Error('Ticket has already been boarded');
    }
    if (ticket.paymentStatus !== 'paid') {
      throw new Error('Only paid tickets can be boarded');
    }

    return this.ticketRepo.markBoarded(ticketId, boardedById);
  }

  // -------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------

  /**
   * Build a ready-to-copy payment message for the staff member to send
   * to the attendee via WhatsApp, email, or other channel.
   */
  private buildPaymentMessage(
    ticket: Ticket,
    eventTitle: string,
    instructions: EventPaymentInstructions | null
  ): string {
    if (!instructions) {
      return (
        `Hi ${ticket.issuedToName},\n\n` +
        `Your ticket ${ticket.ticketNumber} for "${eventTitle}" has been confirmed.\n\n` +
        `Please contact the organizer for payment details.\n`
      );
    }

    // Compute payment deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (instructions.paymentDeadlineDays ?? 7));
    const deadlineStr = deadline.toLocaleDateString('fi-FI'); // e.g. "4.3.2026"

    // Merge ticket number into reference format
    const reference = instructions.referenceFormat
      ? instructions.referenceFormat.replace('{ticket_number}', ticket.ticketNumber)
      : ticket.ticketNumber;

    const lines = [
      `Hi ${ticket.issuedToName},`,
      ``,
      `Your ticket ${ticket.ticketNumber} for "${eventTitle}" is confirmed.`,
      `Please transfer the payment:`,
      ``,
      `  Bank:      ${instructions.bankName}`,
      `  IBAN:      ${instructions.iban}`,
      `  Account:   ${instructions.accountHolder}`,
      `  Amount:    ${instructions.currency} ${instructions.amountPerPerson.toFixed(2)}`,
      `  Reference: ${reference}`,
      `  Pay by:    ${deadlineStr}`,
    ];

    if (instructions.notes) {
      lines.push(``, `Note: ${instructions.notes}`);
    }

    lines.push(``, `Questions? Reply to this message.`);

    return lines.join('\n');
  }
}
