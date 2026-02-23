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
  childrenNamesAndAges?: string;
  vegetarianMealCount: number;
  nonVegetarianMealCount: number;
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
  childrenNamesAndAges?: string;
  vegetarianMealCount?: number;
  nonVegetarianMealCount?: number;
  otherPreferences?: string;
  consentToStorePersonalData: boolean;
};
