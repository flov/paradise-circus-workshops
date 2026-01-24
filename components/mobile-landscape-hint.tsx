"use client";

import { useState, useEffect } from "react";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileLandscapeHint() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check initial orientation
    const checkOrientation = () => {
      // Check if window is available (client-side only)
      if (typeof window === "undefined") return;

      // Check if it's a mobile device (width < 768px which is md breakpoint)
      const isMobile = window.innerWidth < 768;

      // Check if in portrait mode (height > width)
      const portrait = window.innerHeight > window.innerWidth;

      setIsPortrait(isMobile && portrait);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    // Also check after a short delay to catch orientation changes
    const timeoutId = setTimeout(checkOrientation, 100);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      clearTimeout(timeoutId);
    };
  }, []);

  // Don't show if dismissed or not in portrait mode
  if (isDismissed || !isPortrait) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes rotate-phone {
            0% {
              transform: rotate(0deg);
            }
            40% {
              transform: rotate(90deg);
            }
            60% {
              transform: rotate(90deg);
            }
            80% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }
          .phone-rotate-animation {
            animation: rotate-phone 3s ease-in-out infinite;
            transform-origin: center;
          }
        `,
        }}
      />
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-secondary/95 backdrop-blur-sm text-secondary-foreground rounded-lg border border-secondary/20 shadow-lg p-4 flex items-center gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-5 w-5 phone-rotate-animation" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Rotate your phone to landscape mode for a weekly calendar view
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/20"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
