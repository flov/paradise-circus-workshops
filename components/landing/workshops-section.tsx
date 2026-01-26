"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
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

export function WorkshopsSection({
  workshopsThisWeek,
  artistsCount,
}: WorkshopsSectionProps) {
  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Learn Something New Every Day
          </span>
          <h2
            style={{ fontFamily: "var(--font-rye)" }}
            className="text-3xl md:text-5xl font-serif text-foreground mt-4 mb-6 text-balance"
          >
            Daily Workshops
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From afternoon poi lessons to late-night fire spinning, there&apos;s
            always something happening at Paradise Circus. All workshops are
            taught by community members, donation-driven.
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

        {/* Workshop categories - Combined card */}
        <Card className="mb-12 border-border/50 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-serif font-bold text-foreground">
                  Type of Workshops
                </CardTitle>
                <CardDescription className="text-sm md:text-base mt-1">
                  A mix of flow arts, skill-building, and playful performance —
                  drop in and try something new.
                </CardDescription>
              </div>

              <CardAction className="shrink-0 hidden sm:flex items-center gap-2 md:gap-3">
                {workshopCategories.map((category) => (
                  <span
                    key={category.title}
                    className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10"
                    aria-hidden="true"
                  >
                    <span className="text-xl md:text-2xl">{category.icon}</span>
                  </span>
                ))}
              </CardAction>
            </div>
          </CardHeader>
          <CardContent>
            {/* Categories */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workshopCategories.map((category) => (
                <div
                  key={category.title}
                  className="rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:bg-background/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-xl" aria-hidden="true">
                        {category.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground leading-snug">
                        {category.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
