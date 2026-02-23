"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "@/state/session";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2 } from "lucide-react";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStatus, profile } = useSession();

  useEffect(() => {
    if (authStatus === "authenticated" && profile && profile.role !== "admin") {
      redirect("/not-authorized");
    }
  }, [authStatus, profile]);

  // Show loading state
  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (authStatus === "anonymous" || !profile) {
    redirect("/not-authorized");
  }

  // Redirect if not admin
  if (profile.role !== "admin") {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
