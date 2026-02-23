"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppUser } from "@/models/user";
import { onAuthStateChange, signOut as authSignOut } from "@/services/authService";
import type { Session } from "@supabase/supabase-js";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type SessionContextType = {
  authStatus: AuthStatus;
  profile: AppUser | null;
  currentUser: AppUser | null;
  lastAuthError: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  // Load profile from auth session
  const loadProfile = async (session: Session | null) => {
    if (!session?.user) {
      setProfile(null);
      setAuthStatus("anonymous");
      return;
    }

    try {
      // Fetch existing profile (created by OAuth callback handler on server)
      const { getProfileById } = await import("@/services/profileService");
      const userProfile = await getProfileById(session.user.id);
      
      if (userProfile) {
        setProfile(userProfile);
        setAuthStatus("authenticated");
        setLastAuthError(null);
      } else {
        console.error("Profile not found for user:", session.user.id);
        setLastAuthError("Profile not found. Please contact support.");
        setProfile(null);
        setAuthStatus("anonymous");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setLastAuthError(error instanceof Error ? error.message : "Failed to load profile");
      setProfile(null);
      setAuthStatus("anonymous");
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    // Explicitly fetch initial session from cookies on mount
    const initializeSession = async () => {
      console.log('🔍 SessionProvider: Fetching initial session from cookies...');
      const { data: { session } } = await import("@/services/authService").then(m => m.getSession());
      console.log('🔍 Initial session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      await loadProfile(session);
    };

    // Initialize session first
    initializeSession();

    // Then subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await loadProfile(session);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setAuthStatus("anonymous");
      } else if (event === "INITIAL_SESSION") {
        await loadProfile(session);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await authSignOut();
      setProfile(null);
      setAuthStatus("anonymous");
      setLastAuthError(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setLastAuthError(error instanceof Error ? error.message : "Failed to sign out");
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await import("@/services/authService").then(m => m.getSession());
    await loadProfile(session);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        authStatus, 
        profile, 
        currentUser: profile,
        lastAuthError, 
        logout,
        refreshProfile
      }}
    >
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

// Backward compatibility helpers
export function useCurrentUser() {
  const { profile } = useSession();
  return profile;
}
