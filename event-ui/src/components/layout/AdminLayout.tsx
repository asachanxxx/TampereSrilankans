"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Settings, Menu, ShieldCheck, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
 SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/state/session";
import { UserMenuDropdown } from "@/components/header/UserMenuDropdown";
import { cn } from "@/lib/utils";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { currentUser } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/events", icon: Calendar, label: "Events" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/permissions", icon: Lock, label: "Permissions" },
    { href: "/admin/settings", icon: Settings, label: "Settings", disabled: true },
  ];

  const NavContent = () => (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : item.disabled
                ? "text-muted-foreground cursor-not-allowed opacity-50"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="text-left">Admin Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <UserMenuDropdown />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-screen sticky top-0">
          <div className="p-6">
            <Link href="/admin" className="flex items-center gap-3 font-semibold text-sm mb-8">
              <Calendar className="h-6 w-6 flex-shrink-0" />
              <div className="leading-tight">
                <div>Sri Lankan Association</div>
                <div>in Tampere</div>
              </div>
            </Link>
            
            <div className="mb-6">
              <Badge variant="destructive" className="text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Admin Panel
              </Badge>
            </div>

            <NavContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Desktop Top Bar */}
          <div className="hidden lg:flex h-16 items-center justify-end px-6 border-b">
            <UserMenuDropdown />
          </div>

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
