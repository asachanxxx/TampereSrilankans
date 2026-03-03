/**
 * A single child entry attached to a registration via its ticket.
 * Maps to registration_children table.
 */
export type RegistrationChild = {
  id?: string;
  ticketId?: string;
  childName: string;
  childAge: number;
};

/**
 * Registration model - represents a user's registration for an event
 * Maps to event_registrations table
 */
export type Registration = {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string; // ISO datetime
  fullName: string;
  whatsappNumber?: string;
  email: string;
  spouseName?: string;
  childrenUnder7Count: number;
  childrenOver7Count: number;
  childrenNamesAndAges?: string; // legacy free-text field, kept for backward compat
  children?: RegistrationChild[];
  vegetarianMealCount: number;
  nonVegetarianMealCount: number;
  kidsMealCount: number;
  otherPreferences?: string;
  consentToStorePersonalData: boolean;
};

export type RegistrationFormData = {
  fullName: string;
  whatsappNumber?: string;
  email: string;
  spouseName?: string;
  childrenUnder7Count?: number;
  childrenOver7Count?: number;
  childrenNamesAndAges?: string; // legacy, no longer populated by new UI
  children?: RegistrationChild[];
  vegetarianMealCount?: number;
  nonVegetarianMealCount?: number;
  kidsMealCount?: number;
  otherPreferences?: string;
  consentToStorePersonalData: boolean;
};
