"use client";

import { ReactNode } from "react";
import { AppHeader } from "@/components/header/AppHeader";

type PublicLayoutProps = {
  children: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © 2026 Sri Lankan Association in Tampere. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
