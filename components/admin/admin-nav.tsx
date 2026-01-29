"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, UserCheck, Menu, X, LayoutDashboard, Package } from "lucide-react";

interface AdminNavProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/participations", label: "Participations", icon: UserCheck },
  { href: "/admin/pending-approval", label: "Pending Approval", icon: Clock },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/props", label: "Props", icon: Package },
];

export function AdminNav({ title, description, children }: AdminNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            {children}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {children}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
