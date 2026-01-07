"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Animated 404 with circus elements */}
        <div className="space-y-4">
          <div className="text-9xl font-bold text-primary relative">
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0s" }}
            >
              4
            </span>
            <span className="inline-block text-6xl mx-4 animate-spin">🎪</span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0.2s" }}
            >
              4
            </span>
          </div>

          {/* Circus tent decoration */}
          <div className="flex justify-center gap-2 text-4xl mb-4">
            <span className="animate-pulse" style={{ animationDelay: "0s" }}>
              🎭
            </span>
            <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>
              🎨
            </span>
            <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>
              🎪
            </span>
            <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>
              🎯
            </span>
          </div>
        </div>

        {/* Funny message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Oops! The Show Has Left the Tent! 🎪
          </h1>
          <p className="text-xl text-muted-foreground">
            Looks like this page has vanished faster than a magician&apos;s
            rabbit! 🐰✨
          </p>
          <p className="text-lg text-muted-foreground">
            Don&apos;t worry, even the best performers miss their mark
            sometimes. Let&apos;s get you back to the main stage!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Return to Main Stage
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            <Search className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Fun footer message */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0s" }}
            >
              🎪
            </span>{" "}
            Remember: In the circus of life, every wrong turn is just a new act!{" "}
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0.3s" }}
            >
              🎭
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
