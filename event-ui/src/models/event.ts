export type EventRating = {
  average: number; // 0..5
  count: number;   // number of ratings
};

export type EventStatusId = "upcoming" | "ongoing" | "ticket_closed" | "archive";

export type Event = {
  id: string;
  title: string;
  subtitle?: string;

  eventDate: string;     // ISO date (e.g., "2026-02-17")
  
  // Database fields for rating
  ratingAverage?: number;  // 0..5 - stored in DB
  ratingCount?: number;    // number of ratings - stored in DB
  
  // Legacy UI field (can be computed from ratingAverage/ratingCount)
  rating?: EventRating;  // optional

  statusId: EventStatusId; // upcoming | ongoing | ticket_closed | archive
  categoryId: string;    // from JSON
  visibilityId: string;  // from JSON

  startAt: string;       // ISO datetime
  endAt?: string;        // ISO datetime

  locationName?: string;
  city?: string;

  coverImageUrl?: string;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  shortDescription: string;
  description: string;

  // About section (customizable)
  aboutSectionTitle?: string; // Default: "About This Event"

  organizerName: string;
  createdAt?: string; // ISO datetime - when event was created

  // -------------------------------------------------------
  // Payment instructions (configured per event by organizer/admin)
  // -------------------------------------------------------
  paymentInstructions?: EventPaymentInstructions | null;
};

/**
 * Per-event payment configuration stored as JSONB in the events table.
 * Staff uses this template to generate the payment message sent to attendees.
 */
export type EventPaymentInstructions = {
  /** Bank name, e.g. "OP Bank" */
  bankName: string;
  /** IBAN, e.g. "FI12 3456 7890 1234 56" */
  iban: string;
  /** Account holder name, e.g. "Tampere Sri Lankans ry" */
  accountHolder: string;
  /** Price per person in the event currency */
  amountPerPerson: number;
  /** ISO 4217 currency code, e.g. "EUR" */
  currency: string;
  /**
   * Reference number format string.
   * Use {ticket_number} as a placeholder, e.g. "TICKET-{ticket_number}".
   */
  referenceFormat: string;
  /**
   * Number of days from today the attendee has to complete payment.
   * Used to compute the payment deadline shown in the message.
   */
  paymentDeadlineDays: number;
  /** Additional free-text note included at the bottom of the payment message */
  notes?: string;
};
