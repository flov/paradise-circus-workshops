"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { CustomUserButton } from "@/components/custom-user-button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/timetable", label: "Timetable" },
  { href: "/statistics", label: "Statistics" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isSignedIn } = useAuth();

  // Fetch admin status client-side when signed in (avoids blocking static layout)
  useEffect(() => {
    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin ?? false))
      .catch(() => setIsAdmin(false));
  }, [isSignedIn]);

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎪</span>
            <span
              className="text-xl text-foreground"
              style={{ fontFamily: "var(--font-rye)" }}
            >
              Paradise Circus
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <SignedIn>
                <CustomUserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          {/* Mobile nav - Auth buttons and menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <SignedIn>
                <CustomUserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
            {/* Mobile menu button */}
            <button
              type="button"
              className="p-1 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2">
            <div className="flex flex-col gap-2">
              {allNavItems.map((item, index) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground hover:text-primary transition-colors text-base font-medium py-2 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
