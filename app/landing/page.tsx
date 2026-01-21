import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ShowsSection } from "@/components/landing/shows-section";
import { CommunitySection } from "@/components/landing/community-section";
import { InstagramSection } from "@/components/landing/instagram-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="">
        <HeroSection />
        <WorkshopsSection />
        <ShowsSection />
        <CommunitySection />
        <InstagramSection />
        <Footer />
      </div>
    </main>
  );
}
