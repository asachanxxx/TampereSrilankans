"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/state/session";
import { UserMenuDropdown } from "./UserMenuDropdown";

export function AppHeader() {
  const { currentUser } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#events", label: "Events" },
    { href: "/#about", label: "About" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Calendar className="h-6 w-6 flex-shrink-0" />
            <div className="text-sm sm:text-base leading-tight">
              <div>Sri Lankan Association</div>
              <div>in Tampere</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            {currentUser && currentUser.role === "user" && (
              <Link
                href="/me"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                My Events
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <UserMenuDropdown />
            ) : (
              <Button
                asChild
                size="sm"
                className="hidden md:inline-flex"
              >
                <Link href="/auth">Login</Link>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {currentUser && currentUser.role === "user" && (
                    <Link
                      href="/me"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      My Events
                    </Link>
                  )}
                  {!currentUser && (
                    <Button
                      asChild
                      size="sm"
                    >
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
