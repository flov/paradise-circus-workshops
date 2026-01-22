import { HeroSection } from "@/components/landing/hero-section";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ShowsSection } from "@/components/landing/shows-section";
import { CommunitySection } from "@/components/landing/community-section";
import { InstagramSection } from "@/components/landing/instagram-section";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <WorkshopsSection />
      <ShowsSection />
      <CommunitySection />
      <InstagramSection />
    </main>
  );
}
