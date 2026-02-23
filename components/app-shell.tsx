"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/api-docs") {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <>
      <Navigation />
      <div className="pt-12 flex-1">{children}</div>
      <Footer />
    </>
  );
}
