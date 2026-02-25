import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket } from '../../event-ui/src/models/ticket';
import { randomUUID } from 'crypto';

/**
 * TicketRepository - Data access layer for tickets table
 */
export class TicketRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate a unique ticket number
   * Format: EVT-XXXXXXXX (8 random hex characters)
   */
  generateTicketNumber(): string {
    const uuid = randomUUID().replace(/-/g, '');
    return `EVT-${uuid.substring(0, 8).toUpperCase()}`;
  }

  /**
   * Create a ticket for a user
   */
  async createTicket(
    userId: string | null,
    eventId: string,
    issuedToName: string,
    issuedToEmail: string
  ): Promise<Ticket> {
    const ticketNumber = this.generateTicketNumber();

    const { data, error } = await this.supabase
      .from('tickets')
      .insert([{
        user_id: userId,   // null for guest tickets
        event_id: eventId,
        ticket_number: ticketNumber,
        issued_to_name: issuedToName,
        issued_to_email: issuedToEmail,
        issued_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return this.mapToTicket(data);
  }

  /**
   * Get ticket by internal UUID
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToTicket(data) : null;
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToTicket(data) : null;
  }

  /**
   * Get a guest ticket for a specific event by email (user_id IS NULL)
   */
  async getGuestTicketForEvent(email: string, eventId: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .is('user_id', null)
      .eq('issued_to_email', email)
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToTicket(data) : null;
  }

  /**
   * Get user's ticket for a specific event
   */
  async getUserTicketForEvent(userId: string, eventId: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToTicket(data) : null;
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => this.mapToTicket(row));
  }

  /**
   * Get all tickets for an event (admin only)
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => this.mapToTicket(row));
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
  }

  /**
   * Assign a ticket to a staff member (organizer / moderator / admin).
   * Returns the updated ticket.
   */
  async assignTicket(ticketId: string, assignedToId: string): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update({
        assigned_to_id: assignedToId,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return this.mapToTicket(data);
  }

  /**
   * Mark payment details as sent to the attendee.
   * Requires the ticket to already be assigned.
   * Returns the updated ticket.
   */
  async markPaymentSent(ticketId: string): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update({
        payment_status: 'payment_sent',
        payment_sent_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return this.mapToTicket(data);
  }

  /**
   * Mark ticket as paid (manual confirmation by staff).
   * Returns the updated ticket.
   */
  async markPaid(ticketId: string): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return this.mapToTicket(data);
  }

  /**
   * Mark ticket as boarded (QR scan or manual check-in at event entrance).
   * Returns the updated ticket.
   */
  async markBoarded(ticketId: string, boardedById: string): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update({
        boarding_status: 'boarded',
        boarded_at: new Date().toISOString(),
        boarded_by_id: boardedById,
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return this.mapToTicket(data);
  }

  /**
   * Map database row to Ticket model
   */
  private mapToTicket(row: any): Ticket {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      ticketNumber: row.ticket_number,
      issuedAt: row.issued_at,
      issuedToName: row.issued_to_name || '',
      issuedToEmail: row.issued_to_email || '',
      // Lifecycle: Assignment
      assignedToId: row.assigned_to_id ?? null,
      assignedAt: row.assigned_at ?? null,
      // Lifecycle: Payment
      paymentStatus: row.payment_status ?? null,
      paymentSentAt: row.payment_sent_at ?? null,
      paidAt: row.paid_at ?? null,
      // Lifecycle: Boarding
      boardingStatus: row.boarding_status ?? null,
      boardedAt: row.boarded_at ?? null,
      boardedById: row.boarded_by_id ?? null,
    };
  }
}
