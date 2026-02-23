import { SupabaseClient } from '@supabase/supabase-js';
import { Registration, RegistrationFormData } from '../../event-ui/src/models/registration';

/**
 * RegistrationRepository - Data access layer for event_registrations table
 */
export class RegistrationRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Register a user for an event
   * Returns null if already registered (duplicate constraint)
   */
  async registerUser(userId: string, eventId: string, data: RegistrationFormData): Promise<Registration | null> {
    const { data: row, error } = await this.supabase
      .from('event_registrations')
      .insert([{
        user_id: userId,
        event_id: eventId,
        registered_at: new Date().toISOString(),
        full_name: data.fullName,
        whatsapp_number: data.whatsappNumber ?? null,
        email: data.email,
        spouse_name: data.spouseName ?? null,
        children_under_7_count: data.childrenUnder7Count ?? 0,
        children_over_7_count: data.childrenOver7Count ?? 0,
        children_names_and_ages: data.childrenNamesAndAges ?? null,
        vegetarian_meal_count: data.vegetarianMealCount ?? 0,
        non_vegetarian_meal_count: data.nonVegetarianMealCount ?? 0,
        other_preferences: data.otherPreferences ?? null,
        consent_to_store_personal_data: data.consentToStorePersonalData,
      }])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate registration
      if (error.code === '23505') { // Unique constraint violation
        return null;
      }
      throw error;
    }

    return this.mapToRegistration(row);
  }

  /**
   * Check if user is already registered for an event
   */
  async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false; // Not found
      throw error;
    }

    return !!data;
  }

  /**
   * Get all registrations for a user
   */
  async getUserRegistrations(userId: string): Promise<Registration[]> {
    const { data, error } = await this.supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToRegistration);
  }

  /**
   * Get all registrations for an event (admin only)
   */
  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    const { data, error } = await this.supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToRegistration);
  }

  /**
   * Get registration count for an event
   */
  async getEventRegistrationCount(eventId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Cancel a registration
   */
  async cancelRegistration(userId: string, eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('event_registrations')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
  }

  /**
   * Get registration by ID
   */
  async getRegistrationById(registrationId: string): Promise<Registration | null> {
    const { data, error } = await this.supabase
      .from('event_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapToRegistration(data);
  }

  /**
   * Map database row to Registration model
   */
  private mapToRegistration(row: any): Registration {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      registeredAt: row.registered_at,
      fullName: row.full_name,
      whatsappNumber: row.whatsapp_number ?? undefined,
      email: row.email,
      spouseName: row.spouse_name ?? undefined,
      childrenUnder7Count: row.children_under_7_count ?? 0,
      childrenOver7Count: row.children_over_7_count ?? 0,
      childrenNamesAndAges: row.children_names_and_ages ?? undefined,
      vegetarianMealCount: row.vegetarian_meal_count ?? 0,
      nonVegetarianMealCount: row.non_vegetarian_meal_count ?? 0,
      otherPreferences: row.other_preferences ?? undefined,
      consentToStorePersonalData: row.consent_to_store_personal_data,
    };
  }
}
