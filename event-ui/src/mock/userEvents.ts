// Mapping of userId -> eventIds that user is registered for
export const userEventsMap: Record<string, string[]> = {
  "user-1": ["1", "2", "4"],
  "user-2": ["1", "3"],
  "admin-1": ["1"],
};

export function getUserEventIds(userId: string): string[] {
  return userEventsMap[userId] || [];
}
