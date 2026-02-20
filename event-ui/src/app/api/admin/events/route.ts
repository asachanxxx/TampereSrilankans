import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../../../backend/lib/supabase/server';
import { AdminService } from '../../../../../../../../backend/services/AdminService';
import { requireAdmin } from '../../../../lib/auth';

/**
 * GET /api/admin/events
 * Get all events with statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const stats = searchParams.get('stats');

    if (eventId) {
      // Get statistics for a specific event
      const eventStats = await adminService.getEventStatistics(eventId, user);
      return NextResponse.json(eventStats, { status: 200 });
    } else if (stats === 'platform') {
      // Get platform-wide statistics
      const platformStats = await adminService.getPlatformStatistics(user);
      return NextResponse.json(platformStats, { status: 200 });
    } else {
      // Get all events with stats
      const events = await adminService.getAllEventsWithStats(user);
      return NextResponse.json({ events }, { status: 200 });
    }
  } catch (error: any) {
    console.error('GET /api/admin/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin data' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/events
 * Bulk update events (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const supabase = await createClient();
    const adminService = new AdminService(supabase);

    const body = await request.json();
    const { eventIds, statusId } = body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      );
    }

    if (!statusId) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      );
    }

    await adminService.bulkUpdateEventStatus(eventIds, statusId, user);

    return NextResponse.json(
      { message: 'Events updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT /api/admin/events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update events' },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    );
  }
}
