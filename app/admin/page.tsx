import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Orbit, TrendingUp, UserCheck, BarChart3, ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  const statSections = [
    {
      title: "Props by Users",
      description: "View which props are most popular and see the users using them",
      href: "/admin/stats/props",
      icon: Orbit,
    },
    {
      title: "Community Growth",
      description: "Track community growth over time with weekly statistics",
      href: "/admin/stats/growth",
      icon: TrendingUp,
    },
    {
      title: "Top Instructors",
      description: "See the most active instructors by workshop count",
      href: "/admin/stats/instructors",
      icon: UserCheck,
    },
    {
      title: "Skill Distribution",
      description: "Analyze skill levels across different props",
      href: "/admin/stats/skills",
      icon: BarChart3,
    },
    {
      title: "Event Statistics",
      description: "Workshop counts, participations, and trends by prop and over time",
      href: "/admin/stats/events",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Admin Dashboard"
        description="Statistics and insights - click on a section to view"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {statSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription className="mt-2">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Statistics
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
