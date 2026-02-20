/**
 * Registration model - represents a user's registration for an event
 * Maps to event_registrations table
 */
export type Registration = {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string; // ISO datetime
};
