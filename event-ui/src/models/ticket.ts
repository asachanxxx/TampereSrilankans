export type Ticket = {
  id: string;
  eventId: string;
  userId: string;        // Foreign key to auth.users.id
  ticketNumber: string;  // Unique ticket identifier
  issuedAt: string;      // ISO datetime - when ticket was issued
  issuedToName: string;
  issuedToEmail: string;
};
