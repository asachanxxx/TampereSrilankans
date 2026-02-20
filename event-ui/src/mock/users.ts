import { AppUser } from "@/models/user";

export const mockUsers: AppUser[] = [
  {
    id: "user-1",
    name: "John Michael Smith",
    displayName: "John Smith",
    email: "john.smith@example.com",
    role: "user",
  },
  {
    id: "admin-1",
    name: "Sarah Elizabeth Johnson",
    displayName: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "admin",
  },
  {
    id: "user-2",
    name: "Emma Louise Davis",
    displayName: "Emma Davis",
    email: "emma.davis@example.com",
    role: "user",
  },
];
