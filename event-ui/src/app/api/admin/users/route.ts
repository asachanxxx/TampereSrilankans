import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { AdminService } from '@backend/services/AdminService';
import { requireAdmin } from '../../../../lib/auth';

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get specific user
      const targetUser = await adminService.getUserById(userId, user);
      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ user: targetUser }, { status: 200 });
    } else {
      // Get all users
      const users = await adminService.getAllUsers(user);
      return NextResponse.json({ users }, { status: 200 });
    }
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/users
 * Update user role (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const body = await request.json();
    const { userId, role, displayName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'member', 'moderator', 'organizer', 'admin'];
    if (role !== undefined && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Valid role required: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    if (!role && !displayName) {
      return NextResponse.json(
        { error: 'At least one of role or displayName is required' },
        { status: 400 }
      );
    }

    const updates: { role?: any; displayName?: string } = {};
    if (role) updates.role = role;
    if (displayName !== undefined) updates.displayName = displayName;

    const updatedUser = await adminService.updateUserProfile(userId, updates, user);

    return NextResponse.json(
      { user: updatedUser, message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { 
        status: error.message?.includes('Admin') ? 403 
          : error.message?.includes('demote yourself') ? 400
          : 500 
      }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await adminService.deleteUser(userId, user);

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { 
        status: error.message?.includes('Admin') ? 403 
          : error.message?.includes('delete yourself') ? 400
          : 500 
      }
    );
  }
}
