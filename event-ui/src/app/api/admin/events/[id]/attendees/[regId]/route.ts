import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { RegistrationRepository } from '@backend/repositories/RegistrationRepository';
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

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const repo = new RegistrationRepository(supabase);

    const registration = await repo.updateRegistration(params.regId, fields);

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
