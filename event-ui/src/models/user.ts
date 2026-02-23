export type UserRole = "user" | "member" | "moderator" | "organizer" | "admin";

export type AppUser = {
  id: string;
  name: string;         // internal / legal name
  displayName: string;  // UI display
  email: string;
  role: UserRole;
  createdAt?: string;   // ISO datetime - when user was created
};
