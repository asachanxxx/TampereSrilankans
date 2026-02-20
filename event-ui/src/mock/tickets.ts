import { Ticket } from "@/models/ticket";

// Mock tickets: (userId, eventId) -> Ticket
export const mockTickets: Ticket[] = [
  // User 1 tickets
  {
    id: "ticket-1",
    eventId: "1",
    ticketNumber: "SLNY2026-001234",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  {
    id: "ticket-2",
    eventId: "2",
    ticketNumber: "TCT2026-005678",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  {
    id: "ticket-3",
    eventId: "4",
    ticketNumber: "YEM2026-002341",
    issuedToName: "John Smith",
    issuedToEmail: "john.smith@example.com",
  },
  // User 2 tickets
  {
    id: "ticket-4",
    eventId: "1",
    ticketNumber: "SLNY2026-003456",
    issuedToName: "Emma Davis",
    issuedToEmail: "emma.davis@example.com",
  },
  {
    id: "ticket-5",
    eventId: "3",
    ticketNumber: "VBP2026-004567",
    issuedToName: "Emma Davis",
    issuedToEmail: "emma.davis@example.com",
  },
  // Admin 1 tickets
  {
    id: "ticket-6",
    eventId: "1",
    ticketNumber: "SLNY2026-009876",
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
