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
};
