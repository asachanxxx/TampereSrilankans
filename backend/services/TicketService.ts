import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket } from '../../event-ui/src/models/ticket';
import { EventPaymentInstructions } from '../../event-ui/src/models/event';
import { AppUser } from '../../event-ui/src/models/user';
import { Registration } from '../../event-ui/src/models/registration';
import { TicketRepository, SearchTicketResult } from '../repositories/TicketRepository';
import { RegistrationRepository } from '../repositories/RegistrationRepository';
import { RegistrationValidator } from '../validators/RegistrationValidator';
import { requireAuth, isAdmin, isOrganizer, AuthorizationError } from '../policies/accessControl';
import { TemplateService, TemplateData } from './TemplateService';

/**
 * TicketService - Business logic for ticket operations
 */
export class TicketService {
  private ticketRepo: TicketRepository;
  private registrationRepo: RegistrationRepository;

  constructor(private supabase: SupabaseClient) {
    this.ticketRepo = new TicketRepository(supabase);
    this.registrationRepo = new RegistrationRepository(supabase);
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
   * Returns the updated ticket plus pre-rendered WhatsApp and email messages.
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - Ticket must be assigned (assigned_to_id must be set).
   *  - payment_status must not be 'paid' (resend allowed otherwise).
   */
  async markPaymentSent(
    ticketId: string,
    actor: AppUser | null
  ): Promise<{ ticket: Ticket; whatsappMessage: string; emailMessage: string; emailSubject: string }> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can send payment details');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (!ticket.assignedToId) {
      throw new Error('Ticket must be assigned to a staff member before payment details can be sent');
    }
    if (ticket.paymentStatus === 'paid') {
      throw new Error('Payment has already been confirmed as paid — cannot resend details');
    }
    // paymentStatus === 'payment_sent' → allow resend (regenerate messages, update timestamp)

    // Fetch event payment instructions
    const { data: eventRow, error: eventError } = await this.supabase
      .from('events')
      .select('title, payment_instructions')
      .eq('id', ticket.eventId)
      .single();
    if (eventError) throw eventError;

    const updatedTicket = await this.ticketRepo.markPaymentSent(ticketId);

    const instructions: EventPaymentInstructions | null =
      eventRow?.payment_instructions ?? null;
    const hasInstructions = instructions !== null;

    // Fetch registration to get adult/child counts for price breakdown
    const registration = await this.registrationRepo.getRegistrationForTicket(
      updatedTicket.userId,
      updatedTicket.issuedToEmail,
      updatedTicket.eventId
    );

    // Build template data
    const templateData: TemplateData = {
      display_name: updatedTicket.issuedToName,
      event_name: eventRow?.title ?? 'Event',
      ticket_number: updatedTicket.ticketNumber,
      amount: hasInstructions
        ? `${instructions!.currency} ${instructions!.amountPerPerson.toFixed(2)}`
        : '',
      due_date: hasInstructions
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + (instructions!.paymentDeadlineDays ?? 7));
            return d.toLocaleDateString('fi-FI');
          })()
        : '',
      bank_name: instructions?.bankName,
      iban: instructions?.iban,
      account_holder: instructions?.accountHolder,
      reference: hasInstructions && instructions!.referenceFormat
        ? instructions!.referenceFormat.replace('{ticket_number}', updatedTicket.ticketNumber)
        : updatedTicket.ticketNumber,
      notes: instructions?.notes,
      payment_breakdown: buildPaymentBreakdown(registration, instructions),
    };

    const templateKey = hasInstructions
      ? 'payment_reminder'
      : 'payment_no_instructions';

    const templateService = new TemplateService();
    const whatsapp = templateService.render(`${templateKey}_whatsapp`, 'whatsapp', templateData);
    const email = templateService.render(`${templateKey}_email`, 'email', templateData);

    return {
      ticket: updatedTicket,
      whatsappMessage: whatsapp.body,
      emailMessage: email.body,
      emailSubject: email.subject ?? `Payment details for ${templateData.event_name}`,
    };
  }

  /**
   * Preview the payment message for a ticket without updating its status.
   * Useful for staff to see the exact message before (or after) sending it.
   *
   * Rules:
   *  - Actor must be organizer, moderator, or admin.
   *  - Ticket must exist.
   */
  async previewPaymentMessage(
    ticketId: string,
    actor: AppUser | null
  ): Promise<{ whatsappMessage: string; emailMessage: string; emailSubject: string }> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can preview payment messages');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const { data: eventRow, error: eventError } = await this.supabase
      .from('events')
      .select('title, payment_instructions')
      .eq('id', ticket.eventId)
      .single();
    if (eventError) throw eventError;

    const instructions: EventPaymentInstructions | null =
      eventRow?.payment_instructions ?? null;
    const hasInstructions = instructions !== null;

    // Fetch registration to get adult/child counts for price breakdown
    const registration = await this.registrationRepo.getRegistrationForTicket(
      ticket.userId,
      ticket.issuedToEmail,
      ticket.eventId
    );

    const templateData: TemplateData = {
      display_name: ticket.issuedToName,
      event_name: eventRow?.title ?? 'Event',
      ticket_number: ticket.ticketNumber,
      amount: hasInstructions
        ? `${instructions!.currency} ${instructions!.amountPerPerson.toFixed(2)}`
        : '',
      due_date: hasInstructions
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + (instructions!.paymentDeadlineDays ?? 7));
            return d.toLocaleDateString('fi-FI');
          })()
        : '',
      bank_name: instructions?.bankName,
      iban: instructions?.iban,
      account_holder: instructions?.accountHolder,
      reference: hasInstructions && instructions!.referenceFormat
        ? instructions!.referenceFormat.replace('{ticket_number}', ticket.ticketNumber)
        : ticket.ticketNumber,
      notes: instructions?.notes,
      payment_breakdown: buildPaymentBreakdown(registration, instructions),
    };

    const templateKey = hasInstructions ? 'payment_reminder' : 'payment_no_instructions';
    const templateService = new TemplateService();
    const whatsapp = templateService.render(`${templateKey}_whatsapp`, 'whatsapp', templateData);
    const email = templateService.render(`${templateKey}_email`, 'email', templateData);

    return {
      whatsappMessage: whatsapp.body,
      emailMessage: email.body,
      emailSubject: email.subject ?? `Payment details for ${templateData.event_name}`,
    };
  }

  /**
   * Preview a repeat payment reminder message for a ticket (does NOT change ticket state).
   * Uses the payment_repeat_reminder template instead of the initial payment_reminder.
   */
  async previewReminderMessage(
    ticketId: string,
    actor: AppUser | null
  ): Promise<{ whatsappMessage: string; emailMessage: string; emailSubject: string }> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can preview reminder messages');
    }

    const ticket = await this.ticketRepo.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const { data: eventRow, error: eventError } = await this.supabase
      .from('events')
      .select('title, payment_instructions')
      .eq('id', ticket.eventId)
      .single();
    if (eventError) throw eventError;

    const instructions: EventPaymentInstructions | null =
      eventRow?.payment_instructions ?? null;

    const registration = await this.registrationRepo.getRegistrationForTicket(
      ticket.userId,
      ticket.issuedToEmail,
      ticket.eventId
    );

    const templateData: TemplateData = {
      display_name: ticket.issuedToName,
      event_name: eventRow?.title ?? 'Event',
      ticket_number: ticket.ticketNumber,
      amount: instructions
        ? `${instructions.currency} ${instructions.amountPerPerson.toFixed(2)}`
        : '',
      due_date: '',
      bank_name: instructions?.bankName,
      iban: instructions?.iban,
      account_holder: instructions?.accountHolder,
      reference: instructions?.referenceFormat
        ? instructions.referenceFormat.replace('{ticket_number}', ticket.ticketNumber)
        : ticket.ticketNumber,
      notes: instructions?.notes,
      payment_breakdown: buildPaymentBreakdown(registration, instructions),
    };

    const templateService = new TemplateService();
    const whatsapp = templateService.render('payment_repeat_reminder_whatsapp', 'whatsapp', templateData);
    const email = templateService.render('payment_repeat_reminder_email', 'email', templateData);

    return {
      whatsappMessage: whatsapp.body,
      emailMessage: email.body,
      emailSubject: email.subject ?? `Payment Reminder for ${templateData.event_name}`,
    };
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
    if (ticket.paymentStatus !== 'paid' && !isAdmin(actor)) {
      throw new Error('Only paid tickets can be boarded');
    }

    return this.ticketRepo.markBoarded(ticketId, boardedById);
  }

  /**
   * Search tickets by name, email, ticket number, or phone number.
   * Requires organizer / moderator / admin.
   */
  async searchTickets(
    query: string,
    actor: AppUser | null
  ): Promise<SearchTicketResult[]> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can search tickets');
    }
    return this.ticketRepo.searchTickets(query);
  }

  /**
   * Increment the reminder_count for a ticket (called when staff copies/sends a reminder).
   */
  async recordReminderSent(
    ticketId: string,
    actor: AppUser | null
  ): Promise<{ reminderCount: number }> {
    requireAuth(actor);
    if (!isOrganizer(actor)) {
      throw new AuthorizationError('Only organizers, moderators, and admins can record reminders');
    }
    const ticket = await this.ticketRepo.incrementReminderCount(ticketId);
    return { reminderCount: ticket.reminderCount };
  }
}

// ---------------------------------------------------------------------------
// Helper: build payment breakdown string
// ---------------------------------------------------------------------------

function buildPaymentBreakdown(
  registration: Registration | null,
  instructions: EventPaymentInstructions | null
): string | undefined {
  if (!instructions || !registration) return undefined;

  const adultPrice = instructions.adultTicketPrice;
  const childPrice = instructions.childTicketPrice;
  if (adultPrice === undefined && childPrice === undefined) return undefined;

  const currency = instructions.currency ?? 'EUR';
  const adultCount = 1 + (registration.spouseName?.trim() ? 1 : 0);
  const childCount = registration.childrenOver7Count ?? 0;

  const lines: string[] = [];

  if (adultPrice !== undefined) {
    const adultTotal = adultPrice * adultCount;
    lines.push(`Adult x ${adultCount} = ${currency} ${adultTotal.toFixed(2)}`);
  }

  if (childPrice !== undefined && childCount > 0) {
    const childTotal = childPrice * childCount;
    lines.push(`Over 7 x ${childCount} = ${currency} ${childTotal.toFixed(2)}`);
  } else if (childPrice !== undefined && childCount === 0) {
    lines.push(`Over 7 x 0 = ${currency} 0.00`);
  }

  const total =
    (adultPrice !== undefined ? adultPrice * adultCount : 0) +
    (childPrice !== undefined ? childPrice * childCount : 0);
  lines.push(`Total = ${currency} ${total.toFixed(2)}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// End of TicketService module
// ---------------------------------------------------------------------------
