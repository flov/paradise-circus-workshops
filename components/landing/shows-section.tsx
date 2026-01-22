"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Mic, Users } from "lucide-react";

const shows = [
  {
    day: "Tuesday",
    title: "Open Stage",
    description:
      "An open night where anyone can perform. Perfect for trying new acts!",
    highlight: false,
  },
  {
    day: "Thursday",
    title: "Main Show",
    description:
      "Our signature weekly show featuring the best acts from the community.",
    highlight: true,
  },
  {
    day: "Sunday",
    title: "Main Show",
    description:
      "End the week with another spectacular showcase of talent and creativity.",
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
          <h2
            style={{ fontFamily: "var(--font-rye)" }}
            className="text-3xl md:text-5xl font-serif text-foreground mt-4 mb-6 text-balance"
          >
            Weekly Shows
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every week we come together to celebrate our art. Two main shows and
            one open stage — your chance to witness magic or become part of it.
          </p>
        </div>

        {/* Shows grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {shows.map((show, index) => {
            const isFirstMainShow =
              show.day === "Thursday" && show.title === "Main Show";
            return (
              <Card
                key={show.day}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  show.highlight
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
                style={
                  isFirstMainShow
                    ? {
                        backgroundImage:
                          "url('/images/fire-eating-paradise.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined
                }
              >
                {/* Dark overlay for readability */}
                {isFirstMainShow && (
                  <div className="absolute inset-0 bg-black/25 z-0" />
                )}
                <CardContent className="p-8 relative z-10">
                  <p
                    className={`text-sm font-medium uppercase tracking-wider mb-2 ${
                      show.highlight
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    Every {show.day}
                  </p>
                  <h3
                    style={{ fontFamily: "var(--font-rye)" }}
                    className={`text-2xl font-serif mb-3 ${
                      show.highlight
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {show.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      show.highlight
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {show.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
