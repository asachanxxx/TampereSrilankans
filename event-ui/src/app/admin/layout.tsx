"use client";

import { useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import { useSession } from "@/state/session";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2 } from "lucide-react";

const STAFF_PATHS = ["/admin/event-management"];

function isOrganizer(role: string) {
  return role === "organizer" || role === "moderator" || role === "admin";
}

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStatus, profile } = useSession();
  const pathname = usePathname();

  const isStaffAllowedPath = STAFF_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (authStatus === "authenticated" && profile) {
      if (isStaffAllowedPath) {
        if (!isOrganizer(profile.role)) redirect("/not-authorized");
      } else {
        if (profile.role !== "admin") redirect("/not-authorized");
      }
    }
  }, [authStatus, profile, isStaffAllowedPath]);

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

  // Gate: staff-allowed paths require organizer+; all other paths require admin
  if (isStaffAllowedPath) {
    if (!isOrganizer(profile.role)) return null;
  } else {
    if (profile.role !== "admin") return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
