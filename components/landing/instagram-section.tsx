"use client";

import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

export function InstagramSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-6">
          <Instagram className="w-8 h-8 text-primary-foreground" />
        </div>

        <h2
          style={{ fontFamily: "var(--font-rye)" }}
          className="text-3xl md:text-4xl font-serif text-foreground mb-4 text-balance"
        >
          Follow the Journey
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Check out our Instagram for the latest stories, behind-the-scenes
          moments, and highlights from our vibrant community.
        </p>

        <Button
          asChild
          size="lg"
          className="rounded-full px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          <a
            href="https://www.instagram.com/paradise_pai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="mr-2 w-5 h-5" />
            @paradise_pai
          </a>
        </Button>
      </div>
    </section>
  );
}
