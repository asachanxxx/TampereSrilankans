import { SupabaseClient } from '@supabase/supabase-js';
import { RegistrationChild } from '../../event-ui/src/models/registration';

export class ChildrenRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Save children for a ticket. Replaces all existing children for that ticket.
   */
  async saveChildren(ticketId: string, children: RegistrationChild[]): Promise<void> {
    if (!children || children.length === 0) return;

    const rows = children.map((c) => ({
      ticket_id: ticketId,
      child_name: c.childName.trim(),
      child_age: c.childAge,
    }));

    const { error } = await this.supabase
      .from('registration_children')
      .insert(rows);

    if (error) {
      throw new Error(`Failed to save children details: ${error.message}`);
    }
  }

  /**
   * Get all children for a ticket.
   */
  async getChildrenByTicketId(ticketId: string): Promise<RegistrationChild[]> {
    const { data, error } = await this.supabase
      .from('registration_children')
      .select('id, ticket_id, child_name, child_age')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch children: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      ticketId: row.ticket_id,
      childName: row.child_name,
      childAge: row.child_age,
    }));
  }

  /**
   * Get children for multiple ticket IDs in one query.
   * Returns a map of ticketId → RegistrationChild[]
   */
  async getChildrenByTicketIds(ticketIds: string[]): Promise<Record<string, RegistrationChild[]>> {
    if (ticketIds.length === 0) return {};

    const { data, error } = await this.supabase
      .from('registration_children')
      .select('id, ticket_id, child_name, child_age')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch children: ${error.message}`);

    const map: Record<string, RegistrationChild[]> = {};
    for (const row of data ?? []) {
      if (!map[row.ticket_id]) map[row.ticket_id] = [];
      map[row.ticket_id].push({
        id: row.id,
        ticketId: row.ticket_id,
        childName: row.child_name,
        childAge: row.child_age,
      });
    }
    return map;
  }

  /**
   * Replace all children for a ticket (used by admin edit).
   */
  async replaceChildren(ticketId: string, children: RegistrationChild[]): Promise<void> {
    // Delete existing
    const { error: delError } = await this.supabase
      .from('registration_children')
      .delete()
      .eq('ticket_id', ticketId);

    if (delError) throw new Error(`Failed to clear children: ${delError.message}`);

    // Re-insert
    if (children.length > 0) {
      await this.saveChildren(ticketId, children);
    }
  }
}
