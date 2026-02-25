import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@backend/lib/supabase/server';
import { TicketRepository } from '@backend/repositories/TicketRepository';
import { requireAdmin } from '@/lib/auth';
import { TicketStage } from '@/models/ticket';

/**
 * PATCH /api/admin/events/[id]/tickets/[ticketId]
 * Admin-only: directly update a ticket's fields or force a specific lifecycle stage.
 * Used by TicketEditDialog and TicketStatusControl in the event-management workspace.
 *
 * Body options:
 *   issuedToName?, issuedToEmail?       — edit display fields
 *   assignedToId?                       — (re)assign directly
 *   targetStage?                        — 'new' | 'assigned' | 'payment_sent' | 'paid' | 'boarded'
 *     Setting a targetStage computes all necessary column values automatically.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      issuedToName,
      issuedToEmail,
      assignedToId,
      targetStage,
    } = body as {
      issuedToName?: string;
      issuedToEmail?: string;
      assignedToId?: string | null;
      targetStage?: TicketStage;
    };

    const fields: Parameters<InstanceType<typeof TicketRepository>['adminUpdateTicket']>[1] = {};

    if (issuedToName !== undefined) fields.issuedToName = issuedToName;
    if (issuedToEmail !== undefined) fields.issuedToEmail = issuedToEmail;

    if (assignedToId !== undefined) {
      fields.assignedToId = assignedToId;
      fields.assignedAt = assignedToId ? new Date().toISOString() : null;
    }

    // Stage override: compute all columns needed to represent that specific stage
    if (targetStage !== undefined) {
      const now = new Date().toISOString();
      switch (targetStage) {
        case 'new':
          fields.assignedToId = null;
          fields.assignedAt = null;
          fields.paymentStatus = null;
          fields.paymentSentAt = null;
          fields.paidAt = null;
          fields.boardingStatus = null;
          fields.boardedAt = null;
          fields.boardedById = null;
          break;
        case 'assigned':
          fields.paymentStatus = null;
          fields.paymentSentAt = null;
          fields.paidAt = null;
          fields.boardingStatus = null;
          fields.boardedAt = null;
          fields.boardedById = null;
          // assignedToId must already be set (or provided in same request)
          if (assignedToId === undefined) {
            fields.assignedAt = fields.assignedAt ?? now;
          }
          break;
        case 'payment_sent':
          fields.paymentStatus = 'payment_sent';
          fields.paymentSentAt = now;
          fields.paidAt = null;
          fields.boardingStatus = null;
          fields.boardedAt = null;
          fields.boardedById = null;
          break;
        case 'paid':
          fields.paymentStatus = 'paid';
          fields.paidAt = now;
          fields.boardingStatus = null;
          fields.boardedAt = null;
          fields.boardedById = null;
          break;
        case 'boarded':
          fields.paymentStatus = 'paid';
          fields.boardingStatus = 'boarded';
          fields.boardedAt = now;
          break;
      }
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const repo = new TicketRepository(supabase);

    const ticket = await repo.adminUpdateTicket(params.ticketId, fields);

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/admin/events/${params?.id}/tickets/${params?.ticketId} error:`, error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('Admin access') ? 403 :
      error.message?.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status });
  }
}
