// -------------------------------------------------------
// Ticket status types
// -------------------------------------------------------

/** NULL = new (no payment action yet) */
export type TicketPaymentStatus = 'payment_sent' | 'paid' | null;

/** NULL = not yet boarded at event entrance */
export type TicketBoardingStatus = 'boarded' | null;

/**
 * Derived human-readable stage for display purposes.
 * Computed from the three independent status columns.
 * new → assigned → payment_sent → paid → boarded
 */
export type TicketStage = 'new' | 'assigned' | 'payment_sent' | 'paid' | 'boarded';

/** Derive the current stage from a ticket's status columns. */
export function deriveTicketStage(ticket: Ticket): TicketStage {
  if (ticket.boardingStatus === 'boarded') return 'boarded';
  if (ticket.paymentStatus === 'paid') return 'paid';
  if (ticket.paymentStatus === 'payment_sent') return 'payment_sent';
  if (ticket.assignedToId !== null) return 'assigned';
  return 'new';
}

export type Ticket = {
  id: string;
  eventId: string;
  userId: string | null;  // Nullable: null for guest tickets
  ticketNumber: string;   // Unique ticket identifier (EVT-XXXXXXXX)
  issuedAt: string;       // ISO datetime - when ticket was issued
  issuedToName: string;
  issuedToEmail: string;

  // -------------------------------------------------------
  // Lifecycle: Assignment
  // -------------------------------------------------------
  /** ID of the staff member (organizer/moderator/admin) who owns this ticket */
  assignedToId: string | null;
  /** When the ticket was assigned to a staff member */
  assignedAt: string | null;

  // -------------------------------------------------------
  // Lifecycle: Payment
  // -------------------------------------------------------
  /** NULL = not yet actioned, 'payment_sent' = staff sent details, 'paid' = confirmed */
  paymentStatus: TicketPaymentStatus;
  /** When payment details were communicated to the attendee */
  paymentSentAt: string | null;
  /** When payment was confirmed by staff */
  paidAt: string | null;

  // -------------------------------------------------------
  // Lifecycle: Boarding
  // -------------------------------------------------------
  /** NULL = not yet boarded, 'boarded' = scanned/checked-in at entrance */
  boardingStatus: TicketBoardingStatus;
  /** When the attendee was boarded */
  boardedAt: string | null;
  /** ID of the staff member who scanned/boarded the attendee */
  boardedById: string | null;
};
