import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { RegistrationRepository } from '@backend/repositories/RegistrationRepository';
import { ChildrenRepository } from '@backend/repositories/ChildrenRepository';
import { requireAdmin } from '@/lib/auth';

/**
 * PATCH /api/admin/events/[id]/attendees/[regId]
 * Admin-only: directly update any field on a registration.
 * Used by the AttendeeEditDialog in the event-management workspace.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; regId: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      fullName,
      email,
      whatsappNumber,
      spouseName,
      childrenUnder7Count,
      childrenOver7Count,
      childrenNamesAndAges,
      children,
      vegetarianMealCount,
      nonVegetarianMealCount,
      otherPreferences,
    } = body;

    // Build update fields – only include keys that were provided
    const fields: Record<string, any> = {};
    if (fullName !== undefined) fields.full_name = fullName;
    if (email !== undefined) fields.email = email;
    if (whatsappNumber !== undefined) fields.whatsapp_number = whatsappNumber;
    if (spouseName !== undefined) fields.spouse_name = spouseName;
    if (childrenUnder7Count !== undefined) fields.children_under_7_count = childrenUnder7Count;
    if (childrenOver7Count !== undefined) fields.children_over_7_count = childrenOver7Count;
    if (childrenNamesAndAges !== undefined) fields.children_names_and_ages = childrenNamesAndAges;
    if (vegetarianMealCount !== undefined) fields.vegetarian_meal_count = vegetarianMealCount;
    if (nonVegetarianMealCount !== undefined) fields.non_vegetarian_meal_count = nonVegetarianMealCount;
    if (otherPreferences !== undefined) fields.other_preferences = otherPreferences;

    if (Object.keys(fields).length === 0 && children === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const repo = new RegistrationRepository(supabase);

    let registration = null;
    if (Object.keys(fields).length > 0) {
      registration = await repo.updateRegistration(params.regId, fields);
    } else {
      registration = await repo.getRegistrationById(params.regId);
    }

    // Update structured children if provided
    if (children !== undefined && Array.isArray(children)) {
      // Find the ticket via (user_id, event_id) or (email, event_id) for guests
      const reg = registration ?? await repo.getRegistrationById(params.regId);
      if (reg) {
        let ticketQuery = supabase
          .from('tickets')
          .select('id')
          .eq('event_id', reg.eventId);

        if (reg.userId) {
          ticketQuery = ticketQuery.eq('user_id', reg.userId);
        } else {
          ticketQuery = ticketQuery.is('user_id', null).eq('issued_to_email', reg.email);
        }

        const { data: ticketData } = await ticketQuery.single();
        if (ticketData?.id) {
          const childrenRepo = new ChildrenRepository(supabase);
          await childrenRepo.replaceChildren(ticketData.id, children);
        }
      }
    }

    return NextResponse.json({ registration }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/admin/events/${params?.id}/attendees/${params?.regId} error:`, error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('Admin access') ? 403 :
      error.message?.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: error.message || 'Failed to update registration' }, { status });
  }
}
