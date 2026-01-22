"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";

const workshopCategories = [
  {
    title: "Poi, Staff & Flow",
    description:
      "Master the art of spinning with fire, LED, and practice poi, staff, and flow",
    icon: "🔥",
  },
  {
    title: "Juggling",
    description: "Balls, clubs, rings, and contact juggling techniques",
    icon: "🤹",
  },
  {
    title: "Acrobatics",
    description: "Partner acro, handstands, and aerial arts",
    icon: "🤸",
  },
  {
    title: "Clowning & Theater",
    description: "Clowning and improv performance",
    icon: "🤡",
  },
];

interface WorkshopsSectionProps {
  workshopsThisWeek: number;
  artistsCount: number;
}

export function WorkshopsSection({ workshopsThisWeek, artistsCount }: WorkshopsSectionProps) {
  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Learn Something New Every Day
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6 text-balance">
            Free Daily Workshops
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From afternoon poi lessons to late-night fire spinning, there&apos;s
            always something happening at Paradise Circus. All workshops are
            taught by community members, for free.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16">
          <div className="text-center p-4 md:p-6 rounded-2xl bg-background">
            <div className="flex justify-center mb-3">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl md:text-4xl font-bold text-foreground">
              {workshopsThisWeek}
            </p>
            <p className="text-sm text-muted-foreground">Workshops this week</p>
          </div>
          <div className="text-center p-4 md:p-6 rounded-2xl bg-background">
            <div className="flex justify-center mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl md:text-4xl font-bold text-foreground">
              {artistsCount}
            </p>
            <p className="text-sm text-muted-foreground">Artists</p>
          </div>
          <div className="text-center p-4 md:p-6 rounded-2xl bg-background">
            <div className="flex justify-center mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl md:text-4xl font-bold text-foreground">7</p>
            <p className="text-sm text-muted-foreground">Days a week</p>
          </div>
        </div>

        {/* Workshop categories grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {workshopCategories.map((category) => (
            <Card
              key={category.title}
              className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30"
            >
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/timetable">
              View Full Timetable
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
