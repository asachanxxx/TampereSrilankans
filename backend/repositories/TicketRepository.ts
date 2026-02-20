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
    userId: string,
    eventId: string,
    issuedToName: string,
    issuedToEmail: string
  ): Promise<Ticket> {
    const ticketNumber = this.generateTicketNumber();

    const { data, error } = await this.supabase
      .from('tickets')
      .insert([{
        user_id: userId,
        event_id: eventId,
        ticket_number: ticketNumber,
        issued_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return this.mapToTicket(data, issuedToName, issuedToEmail);
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        profiles:user_id (display_name, email)
      `)
      .eq('ticket_number', ticketNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const profile = data.profiles as any;
    return this.mapToTicket(
      data,
      profile?.display_name || 'Unknown',
      profile?.email || 'unknown@example.com'
    );
  }

  /**
   * Get user's ticket for a specific event
   */
  async getUserTicketForEvent(userId: string, eventId: string): Promise<Ticket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        profiles:user_id (display_name, email)
      `)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const profile = data.profiles as any;
    return this.mapToTicket(
      data,
      profile?.display_name || 'Unknown',
      profile?.email || 'unknown@example.com'
    );
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        profiles:user_id (display_name, email)
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => {
      const profile = row.profiles as any;
      return this.mapToTicket(
        row,
        profile?.display_name || 'Unknown',
        profile?.email || 'unknown@example.com'
      );
    });
  }

  /**
   * Get all tickets for an event (admin only)
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        profiles:user_id (display_name, email)
      `)
      .eq('event_id', eventId)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => {
      const profile = row.profiles as any;
      return this.mapToTicket(
        row,
        profile?.display_name || 'Unknown',
        profile?.email || 'unknown@example.com'
      );
    });
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
   * Map database row to Ticket model
   */
  private mapToTicket(row: any, issuedToName: string, issuedToEmail: string): Ticket {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      ticketNumber: row.ticket_number,
      issuedAt: row.issued_at,
      issuedToName,
      issuedToEmail,
    };
  }
}
