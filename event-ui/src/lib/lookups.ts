import eventStatuses from "@/config/event-statuses.json";
import eventCategories from "@/config/event-categories.json";
import eventVisibility from "@/config/event-visibility.json";

export type LookupItem = { id: string; label: string };

// Expose all lookups
export const allStatuses: LookupItem[] = eventStatuses;
export const allCategories: LookupItem[] = eventCategories;
export const allVisibility: LookupItem[] = eventVisibility;

// Helper functions with graceful fallback
export function getStatusLabel(statusId: string): string {
  const item = allStatuses.find((s) => s.id === statusId);
  return item?.label ?? "Unknown";
}

export function getCategoryLabel(categoryId: string): string {
  const item = allCategories.find((c) => c.id === categoryId);
  return item?.label ?? "Unknown";
}

export function getVisibilityLabel(visibilityId: string): string {
  const item = allVisibility.find((v) => v.id === visibilityId);
  return item?.label ?? "Unknown";
}
