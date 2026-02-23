import { SupabaseClient } from '@supabase/supabase-js';

export interface Permission {
  id: string;
  category: string;
  description: string;
}

/**
 * PermissionsRepository - Data access layer for permissions and role_permissions tables
 */
export class PermissionsRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all defined permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('id, category, description')
      .order('category', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      category: row.category as string,
      description: row.description as string,
    }));
  }

  /**
   * Get the permission IDs granted to a single role
   */
  async getRolePermissions(role: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role', role);

    if (error) throw error;

    return (data ?? []).map((row) => row.permission_id as string);
  }

  /**
   * Get the full permission map for all roles – used to populate the in-memory cache
   * Returns: { role: [permissionId, ...] }
   */
  async getAllRolePermissions(): Promise<Record<string, string[]>> {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .select('role, permission_id');

    if (error) throw error;

    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
      const role = row.role as string;
      const perm = row.permission_id as string;
      if (!map[role]) map[role] = [];
      map[role].push(perm);
    }
    return map;
  }

  /**
   * Grant a permission to a role.  No-ops if already granted (ON CONFLICT DO NOTHING).
   */
  async grantPermission(role: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('role_permissions')
      .upsert({ role, permission_id: permissionId }, { onConflict: 'role,permission_id' });

    if (error) throw error;
  }

  /**
   * Revoke a permission from a role.
   */
  async revokePermission(role: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('permission_id', permissionId);

    if (error) throw error;
  }
}
