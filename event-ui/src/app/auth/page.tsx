"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { useSession } from "@/state/session";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { authStatus, profile } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (authStatus === "authenticated" && profile) {
      const redirectTo = profile.role === "admin" ? "/admin" : "/me";
      router.push(redirectTo);
    }
  }, [authStatus, profile, router]);

  // Show loading state
  if (authStatus === "loading") {
    return (
      <AuthCard>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthCard>
    );
  }

  // Don't show auth form if already authenticated
  if (authStatus === "authenticated") {
    return null;
  }

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to continue
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with Google or Facebook to access your account
          </p>
        </div>
        
        <SocialButtons />
        
        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </AuthCard>
  );
}
