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
    console.log('📋 loadProfile called:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      console.log('📋 No session/user → setting anonymous');
      setProfile(null);
      setAuthStatus("anonymous");
      return;
    }

    try {
      // Use the server-side /api/me endpoint instead of querying the DB directly
      // from the browser — the server client reliably reads the session cookie,
      // whereas the browser Supabase client may not have synced it yet right after OAuth.
      const res = await fetch('/api/me');
      const { user: enriched } = await res.json();

      console.log('📋 /api/me response:', {
        found: !!enriched,
        id: enriched?.id,
        displayName: enriched?.displayName,
        email: enriched?.email,
        role: enriched?.role,
      });

      if (enriched) {
        console.log('✅ Profile set from /api/me:', enriched.email);
        setProfile(enriched);
        setAuthStatus("authenticated");
        setLastAuthError(null);
      } else {
        console.error("❌ Profile not found via /api/me for user:", session.user.id);
        setLastAuthError("Profile not found. Please contact support.");
        setProfile(null);
        setAuthStatus("anonymous");
      }
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      setLastAuthError(error instanceof Error ? error.message : "Failed to load profile");
      setProfile(null);
      setAuthStatus("anonymous");
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    // Explicitly check session on mount via server-side /api/me
    const initializeSession = async () => {
      try {
        const res = await fetch('/api/me');
        const { user } = await res.json();
        if (user) {
          console.log('🚀 initializeSession: user found', user.email);
          setProfile(user);
          setAuthStatus("authenticated");
        } else {
          console.log('🚀 initializeSession: no user');
          setProfile(null);
          setAuthStatus("anonymous");
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setAuthStatus("anonymous");
      }
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
    try {
      const res = await fetch('/api/me');
      const { user } = await res.json();
      if (user) {
        setProfile(user);
        setAuthStatus("authenticated");
      } else {
        setProfile(null);
        setAuthStatus("anonymous");
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
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
