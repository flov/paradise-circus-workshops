"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Mic, Users } from "lucide-react";

const shows = [
  {
    day: "Tuesday",
    title: "Open Stage",
    description: "An open mic night where anyone can perform. Perfect for trying new acts!",
    icon: Mic,
    highlight: false,
  },
  {
    day: "Thursday",
    title: "Main Show",
    description: "Our signature weekly show featuring the best acts from the community.",
    icon: Star,
    highlight: true,
  },
  {
    day: "Sunday",
    title: "Main Show",
    description: "End the week with another spectacular showcase of talent and creativity.",
    icon: Star,
    highlight: true,
  },
];

export function ShowsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Live Entertainment
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6 text-balance">
            Weekly Shows
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every week we come together to celebrate our art. Two main shows and 
            one open stage — your chance to witness magic or become part of it.
          </p>
        </div>

        {/* Shows grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {shows.map((show) => {
            const IconComponent = show.icon;
            return (
              <Card 
                key={show.day}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  show.highlight 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
              >
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${
                    show.highlight ? "bg-primary-foreground/20" : "bg-primary/10"
                  }`}>
                    <IconComponent className={`w-6 h-6 ${show.highlight ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${
                    show.highlight ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}>
                    Every {show.day}
                  </p>
                  <h3 className={`text-2xl font-serif font-bold mb-3 ${
                    show.highlight ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    {show.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    show.highlight ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}>
                    {show.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-secondary-foreground">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Everyone is welcome to watch or perform!</span>
          </div>
        </div>
      </div>
    </section>
  );
}
