"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  Clock,
  UserCheck,
  LayoutDashboard,
  Package,
  Activity,
  BarChart3,
  Tag,
  MessageSquare,
} from "lucide-react"

interface AdminNavProps {
  title: string
  description: string
  children?: React.ReactNode
}

const navLinks = [
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/events", label: "Events", icon: Calendar },
  {
    href: "/admin/recurring_events",
    label: "Recurring Events",
    icon: Calendar,
  },
  { href: "/admin/participations", label: "Participations", icon: UserCheck },
  { href: "/admin/pending-approval", label: "Pending Approval", icon: Clock },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/props", label: "Props", icon: Package },
  { href: "/admin/level-migration", label: "Level Migration", icon: Tag },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
]

export function AdminNav({ title, description, children }: AdminNavProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-2 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
            {children}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-2">
          <div className="flex flex-wrap gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" className="justify-start" size="sm">
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
