"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "@/state/session";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useSession();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      redirect("/not-authorized");
    }
  }, [currentUser]);

  if (!currentUser) {
    redirect("/not-authorized");
  }

  if (currentUser.role !== "admin") {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
