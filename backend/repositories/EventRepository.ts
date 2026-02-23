import { SupabaseClient } from '@supabase/supabase-js';
import { Event } from '../../event-ui/src/models/event';

/**
 * EventRepository - Data access layer for events table
 * All database operations for events go through this repository
 */
export class EventRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all public events
   */
  async listPublicEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('visibility_id', 'public')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToEvent);
  }

  /**
   * Get all events (admin only)
   */
  async listAllEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToEvent);
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToEvent(data) : null;
  }

  /**
   * Create a new event (admin only)
   */
  async createEvent(event: Partial<Event>): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .insert([this.mapToDbRow(event)])
      .select()
      .single();

    if (error) throw error;
    return this.mapToEvent(data);
  }

  /**
   * Update an existing event (admin only)
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .update(this.mapToDbRow(updates))
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEvent(data);
  }

  /**
   * Delete an event (admin only)
   */
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  /**
   * Search events by title or description
   */
  async searchEvents(query: string, publicOnly: boolean = true): Promise<Event[]> {
    let queryBuilder = this.supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (publicOnly) {
      queryBuilder = queryBuilder.eq('visibility_id', 'public');
    }

    const { data, error } = await queryBuilder.order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToEvent);
  }

  /**
   * Filter events by category
   */
  async filterByCategory(categoryId: string, publicOnly: boolean = true): Promise<Event[]> {
    let queryBuilder = this.supabase
      .from('events')
      .select('*')
      .eq('category_id', categoryId);

    if (publicOnly) {
      queryBuilder = queryBuilder.eq('visibility_id', 'public');
    }

    const { data, error } = await queryBuilder.order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToEvent);
  }

  /**
   * Map database row to Event model
   */
  private mapToEvent(row: any): Event {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      eventDate: row.event_date,
      ratingAverage: row.rating_average,
      ratingCount: row.rating_count,
      statusId: row.status_id,
      categoryId: row.category_id,
      visibilityId: row.visibility_id,
      startAt: row.start_at,
      endAt: row.end_at,
      locationName: row.location_name,
      city: row.city,
      coverImageUrl: row.cover_image_url,
      shortDescription: row.short_description,
      description: row.description,
      aboutSectionTitle: row.about_section_title,
      organizerName: row.organizer_name,
      createdAt: row.created_at,
      registrationEnabled: row.registration_enabled,
      registrationStatus: row.registration_status,
    };
  }

  /**
   * Map Event model to database row
   */
  private mapToDbRow(event: Partial<Event>): any {
    const row: any = {};
    
    if (event.title !== undefined) row.title = event.title;
    if (event.subtitle !== undefined) row.subtitle = event.subtitle;
    if (event.eventDate !== undefined) row.event_date = event.eventDate;
    if (event.ratingAverage !== undefined) row.rating_average = event.ratingAverage;
    if (event.ratingCount !== undefined) row.rating_count = event.ratingCount;
    if (event.statusId !== undefined) row.status_id = event.statusId;
    if (event.categoryId !== undefined) row.category_id = event.categoryId;
    if (event.visibilityId !== undefined) row.visibility_id = event.visibilityId;
    if (event.startAt !== undefined) row.start_at = event.startAt;
    if (event.endAt !== undefined) row.end_at = event.endAt;
    if (event.locationName !== undefined) row.location_name = event.locationName;
    if (event.city !== undefined) row.city = event.city;
    if (event.coverImageUrl !== undefined) row.cover_image_url = event.coverImageUrl;
    if (event.shortDescription !== undefined) row.short_description = event.shortDescription;
    if (event.description !== undefined) row.description = event.description;
    if (event.aboutSectionTitle !== undefined) row.about_section_title = event.aboutSectionTitle;
    if (event.organizerName !== undefined) row.organizer_name = event.organizerName;
    if (event.registrationEnabled !== undefined) row.registration_enabled = event.registrationEnabled;
    if (event.registrationStatus !== undefined) row.registration_status = event.registrationStatus;
    
    return row;
  }
}
