"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AppUser, UserRole } from "@/models/user";
import { mockUsers } from "@/mock/users";

type SessionContextType = {
  currentUser: AppUser | null;
  loginAs: (role: "user" | "admin") => void;
  loginMock: (data: { email: string }) => void;
  registerMock: (data: { displayName: string; email: string }) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const loginAs = (role: "user" | "admin") => {
    // Find mock user with specified role
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  const loginMock = (data: { email: string }) => {
    // Find existing user by email or use first user
    const user = mockUsers.find((u) => u.email === data.email) || mockUsers.find((u) => u.role === "user");
    if (user) {
      setCurrentUser(user);
    }
  };

  const registerMock = (data: { displayName: string; email: string }) => {
    // Create a new user (in reality, this would be an API call)
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      name: data.displayName,
      displayName: data.displayName,
      email: data.email,
      role: "user",
    };
    setCurrentUser(newUser);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <SessionContext.Provider value={{ currentUser, loginAs, loginMock, registerMock, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
