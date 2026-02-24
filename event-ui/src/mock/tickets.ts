import { Ticket } from "@/models/ticket";

// Mock tickets: (userId, eventId) -> Ticket
export const mockTickets: Ticket[] = [
  // User 1 tickets
  {
    id: "ticket-1",
    eventId: "1",
    userId: "user-1",
    ticketNumber: "SLNY2026-001234",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  {
    id: "ticket-2",
    eventId: "2",
    userId: "user-1",
    ticketNumber: "TCT2026-005678",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  {
    id: "ticket-3",
    eventId: "4",
    userId: "user-1",
    ticketNumber: "YEM2026-002341",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  // User 2 tickets
  {
    id: "ticket-4",
    eventId: "1",
    userId: "user-2",
    ticketNumber: "SLNY2026-003456",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "Emma Davis",
    issuedToEmail: "emma.davis@example.com",
  },
  {
    id: "ticket-5",
    eventId: "3",
    userId: "user-2",
    ticketNumber: "VBP2026-004567",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "Emma Davis",
    issuedToEmail: "emma.davis@example.com",
  },
  // Admin 1 tickets
  {
    id: "ticket-6",
    eventId: "1",
    userId: "admin-1",
    ticketNumber: "SLNY2026-009876",
    issuedAt: "2026-01-01T00:00:00Z",
    issuedToName: "Sarah Johnson",
    issuedToEmail: "sarah.johnson@example.com",
  },
];

export function getUserTicketsForEvent(userId: string, eventId: string): Ticket | undefined {
  return mockTickets.find(
    (ticket) => ticket.eventId === eventId && 
    (ticket.issuedToEmail === getEmailForUserId(userId))
  );
}

// Helper to map userId to email (from mock users)
function getEmailForUserId(userId: string): string {
  const emailMap: Record<string, string> = {
    "user-1": "john.smith@example.com",
    "user-2": "emma.davis@example.com",
    "admin-1": "sarah.johnson@example.com",
  };
  return emailMap[userId] || "";
}
