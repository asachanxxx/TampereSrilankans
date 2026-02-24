import { SupabaseClient } from '@supabase/supabase-js';
import { AppUser } from '../../event-ui/src/models/user';

/**
 * ProfileRepository - Data access layer for profiles table
 */
export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user profile by ID
   */
  async getProfileById(userId: string): Promise<AppUser | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapToAppUser(data);
  }

  /**
   * Get user profile by email
   * Note: This requires listing all users and filtering - inefficient for large datasets
   */
  async getProfileByEmail(email: string): Promise<AppUser | null> {
    // Query profiles table directly (assumes we store email or can join with auth)
    // For production, consider maintaining email in profiles table
    
    // For now, we'll query by searching through auth users
    // This is a workaround since auth.admin doesn't have getUserByEmail in latest version
    const { data } = await this.supabase.auth.admin.listUsers();
    
    const authUser = data.users.find(u => u.email === email);
    if (!authUser) return null;

    return this.getProfileById(authUser.id);
  }

  /**
   * Create a new profile (called after user registration)
   */
  async createProfile(userId: string, displayName: string, email: string, role: 'user' | 'admin' = 'user'): Promise<AppUser> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert([{
        id: userId,
        display_name: displayName,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return this.mapToAppUser(data, email);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { displayName?: string; email?: string; role?: 'user' | 'member' | 'moderator' | 'organizer' | 'admin' }): Promise<AppUser> {
    const dbUpdates: any = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    const { data, error } = await this.supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Get email from auth
    const { data: authData } = await this.supabase.auth.admin.getUserById(userId);
    const email = authData.user?.email || 'unknown@example.com';

    return this.mapToAppUser(data, email);
  }

  /**
   * Get all profiles (admin only)
   */
  async getAllProfiles(): Promise<AppUser[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch all auth users to resolve emails
    const { data: authData } = await this.supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    for (const u of authData?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email;
    }

    return (data || []).map((row) => this.mapToAppUser(row, emailMap[row.id] || 'unknown@example.com'));
  }

  /**
   * Delete a profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getProfileById(userId);
    return profile?.role === 'admin';
  }

  /**
   * Map database row to AppUser model
   */
  private mapToAppUser(row: any, email?: string): AppUser {
    return {
      id: row.id,
      name: row.display_name,
      displayName: row.display_name,
      email: email || row.email || 'unknown@example.com',
      role: row.role,
      createdAt: row.created_at,
    };
  }
}
