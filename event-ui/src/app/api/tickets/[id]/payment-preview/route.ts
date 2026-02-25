import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { TicketService } from '@backend/services/TicketService';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/tickets/[id]/payment-preview
 * Returns the rendered payment message (WhatsApp + email) for a ticket
 * without updating any state. Useful for staff to preview the exact
 * message before or after sending it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth();
    const supabase = createAdminClient();
    const ticketService = new TicketService(supabase);

    const { whatsappMessage, emailMessage, emailSubject } =
      await ticketService.previewPaymentMessage(params.id, actor);

    return NextResponse.json(
      { whatsappMessage, emailMessage, emailSubject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/tickets/[id]/payment-preview error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('access required') || error.message?.includes('Only organizer') ? 403 :
      error.message?.includes('not found') ? 404 :
      400;
    return NextResponse.json(
      { error: error.message || 'Failed to generate payment preview' },
      { status }
    );
  }
}
