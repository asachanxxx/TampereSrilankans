export type Ticket = {
  id: string;
  eventId: string;
  userId: string | null;  // Nullable: null for guest tickets
  ticketNumber: string;   // Unique ticket identifier
  issuedAt: string;       // ISO datetime - when ticket was issued
  issuedToName: string;
  issuedToEmail: string;
};
