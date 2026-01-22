"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              Paradise Circus
            </h3>
            <p className="text-muted-foreground text-sm">
              A flow arts community in Pai, Thailand. Free workshops, weekly shows, 
              and endless creativity.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/timetable" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Weekly Timetable
                </Link>
              </li>
              <li>
                <Link href="/artists" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Our Artists
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Connect</h4>
            <a 
              href="https://www.instagram.com/paradise_pai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @paradise_pai
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Paradise Circus. Made with ❤️ in Pai.
          </p>
          <p className="text-sm text-muted-foreground">
            All workshops are free. Everyone is welcome.
          </p>
        </div>
      </div>
    </footer>
  );
}
