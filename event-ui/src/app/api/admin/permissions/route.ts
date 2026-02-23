import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { PermissionsRepository } from '@backend/repositories/PermissionsRepository';
import { invalidatePermissionCache } from '@backend/policies/accessControl';
import { requireAdmin } from '../../../../lib/auth';

/**
 * GET /api/admin/permissions
 * Returns all permissions and the per-role grant map (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const repo = new PermissionsRepository(supabase);

    const [permissions, rolePermissions] = await Promise.all([
      repo.getAllPermissions(),
      repo.getAllRolePermissions(),
    ]);

    return NextResponse.json({ permissions, rolePermissions }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/permissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/permissions
 * Grant or revoke a single permission for a role (admin only)
 *
 * Body: { role: string; permissionId: string; grant: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const repo = new PermissionsRepository(supabase);

    const body = await request.json();
    const { role, permissionId, grant } = body as {
      role?: string;
      permissionId?: string;
      grant?: boolean;
    };

    if (!role || !permissionId || grant === undefined) {
      return NextResponse.json(
        { error: 'role, permissionId, and grant are required' },
        { status: 400 }
      );
    }

    if (grant) {
      await repo.grantPermission(role, permissionId);
    } else {
      await repo.revokePermission(role, permissionId);
    }

    // Bust the server-side cache so the next hasPermission() call re-loads from DB
    invalidatePermissionCache();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/admin/permissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update permission' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
