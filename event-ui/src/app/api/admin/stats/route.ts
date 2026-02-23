import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/server';
import { AdminService } from '@backend/services/AdminService';
import { requireAdmin } from '../../../../lib/auth';

/**
 * GET /api/admin/stats
 * Platform-wide statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const stats = await adminService.getPlatformStatistics(user);
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
