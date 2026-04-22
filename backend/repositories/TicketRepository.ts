import { SupabaseClient } from '@supabase/supabase-js';
import { Ticket } from '../../event-ui/src/models/ticket';
import { randomUUID } from 'crypto';

export type SearchTicketResult = {
  ticket: Ticket;
  eventTitle: string | null;
};

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
   * Admin-only direct update of any ticket fields (no lifecycle order checks).
   * Used by admin to correct data or override status.
   */
  async adminUpdateTicket(
    ticketId: string,
    fields: {
      issuedToName?: string;
      issuedToEmail?: string;
      assignedToId?: string | null;
      assignedAt?: string | null;
      paymentStatus?: 'payment_sent' | 'paid' | null;
      paymentSentAt?: string | null;
      paidAt?: string | null;
      boardingStatus?: 'boarded' | null;
      boardedAt?: string | null;
      boardedById?: string | null;
    }
  ): Promise<Ticket> {
    const dbUpdates: any = {};
    if (fields.issuedToName !== undefined)  dbUpdates.issued_to_name = fields.issuedToName;
    if (fields.issuedToEmail !== undefined) dbUpdates.issued_to_email = fields.issuedToEmail;
    if ('assignedToId' in fields)           dbUpdates.assigned_to_id = fields.assignedToId;
    if ('assignedAt' in fields)             dbUpdates.assigned_at = fields.assignedAt;
    if ('paymentStatus' in fields)          dbUpdates.payment_status = fields.paymentStatus;
    if ('paymentSentAt' in fields)          dbUpdates.payment_sent_at = fields.paymentSentAt;
    if ('paidAt' in fields)                 dbUpdates.paid_at = fields.paidAt;
    if ('boardingStatus' in fields)         dbUpdates.boarding_status = fields.boardingStatus;
    if ('boardedAt' in fields)              dbUpdates.boarded_at = fields.boardedAt;
    if ('boardedById' in fields)            dbUpdates.boarded_by_id = fields.boardedById;

    const { data, error } = await this.supabase
      .from('tickets')
      .update(dbUpdates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');
    return this.mapToTicket(data);
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
      // Reminder tracking
      reminderCount: row.reminder_count ?? 0,
    };
  }

  /**
   * Search tickets by name, email, ticket number, or phone (whatsapp_number on registration).
   * Returns up to 20 deduplicated results with event title.
   */
  async searchTickets(query: string): Promise<SearchTicketResult[]> {
    const q = `%${query}%`;

    // 1. Direct ticket field search
    const { data: direct } = await this.supabase
      .from('tickets')
      .select('*, events(title)')
      .or(`ticket_number.ilike.${q},issued_to_email.ilike.${q},issued_to_name.ilike.${q}`)
      .limit(15);

    // 2. Phone search via registrations → match tickets by email
    const { data: regMatches } = await this.supabase
      .from('event_registrations')
      .select('email')
      .ilike('whatsapp_number', q)
      .limit(10);

    const phones = [...new Set((regMatches ?? []).map((r: any) => r.email as string))];
    let phoneRows: any[] = [];
    if (phones.length > 0) {
      const { data } = await this.supabase
        .from('tickets')
        .select('*, events(title)')
        .in('issued_to_email', phones)
        .limit(10);
      phoneRows = data ?? [];
    }

    // Merge and deduplicate by ticket id
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const row of [...(direct ?? []), ...phoneRows]) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row);
      }
    }

    return merged.slice(0, 20).map((row) => ({
      ticket: this.mapToTicket(row),
      eventTitle: (row.events as any)?.title ?? null,
    }));
  }

  async incrementReminderCount(ticketId: string): Promise<Ticket> {
    // Read current count then write incremented value
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    const { data, error } = await this.supabase
      .from('tickets')
      .update({ reminder_count: ticket.reminderCount + 1 })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return this.mapToTicket(data);
  }
}
