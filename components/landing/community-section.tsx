"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Globe, Zap } from "lucide-react";

const communityValues = [
  {
    icon: Heart,
    title: "Passion-Driven",
    description: "United by our love for movement, creativity, and the flow state.",
  },
  {
    icon: Globe,
    title: "Global Family",
    description: "Artists from all over the world, sharing skills and stories.",
  },
  {
    icon: Zap,
    title: "Always Growing",
    description: "Every day brings new skills, new friends, and new possibilities.",
  },
];

export function CommunitySection() {
  return (
    <section className="py-20 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              More Than a Space
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6 text-balance">
              A Community of
              <br />
              <span className="text-primary">Circus Legends</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Paradise Circus is like an endless flow arts convention. A place where 
              likeminded people who share a passion for circus and performance arts 
              teach each other every single day. It&apos;s a space for creativity, 
              connection, and growth.
            </p>
            
            <div className="space-y-6 mb-10">
              {communityValues.map((value) => {
                const IconComponent = value.icon;
                return (
                  <div key={value.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/artists">
                Meet Our Artists
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Right side - Visual element */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl md:text-8xl mb-6">🎪</div>
                <p className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
                  Paradise Circus
                </p>
                <p className="text-muted-foreground">
                  Pai, Thailand
                </p>
                
                {/* Floating elements */}
                <div className="absolute top-4 right-4 text-4xl animate-bounce">🔥</div>
                <div className="absolute bottom-12 left-4 text-3xl animate-pulse">🤹</div>
                <div className="absolute top-1/4 left-8 text-2xl">✨</div>
                <div className="absolute bottom-1/4 right-8 text-2xl animate-bounce delay-300">🎭</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
