import { HeroSection } from "@/components/landing/hero-section";
import { WorkshopsSection } from "@/components/landing/workshops-section";
import { ShowsSection } from "@/components/landing/shows-section";
import { CommunitySection } from "@/components/landing/community-section";
import { InstagramSection } from "@/components/landing/instagram-section";
import { db } from "@/db";
import { events, users } from "@/db/schema";
import { and, gte, lte, eq, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Helper function to calculate current week date range (Monday-Sunday)
function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

async function getWorkshopsThisWeekCountUncached(): Promise<number> {
  try {
    const { startDate, endDate } = getCurrentWeekRange();

    const result = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.isWorkshop, true),
          eq(events.isPublished, true),
          gte(events.date, startDate),
          lte(events.date, endDate)
        )
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error fetching workshops count:", error);
    return 0;
  }
}

async function getArtistsCountUncached(): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(users);

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error fetching artists count:", error);
    return 0;
  }
}

// Cache the workshops count for 24 hours (86400 seconds)
const getWorkshopsThisWeekCount = unstable_cache(
  async () => getWorkshopsThisWeekCountUncached(),
  ["workshops-this-week"],
  {
    revalidate: 86400, // 24 hours in seconds
    tags: ["workshops-this-week"],
  }
);

// Cache the artists count for 24 hours (86400 seconds)
const getArtistsCount = unstable_cache(
  async () => getArtistsCountUncached(),
  ["artists-count"],
  {
    revalidate: 86400, // 24 hours in seconds
    tags: ["artists-count"],
  }
);

export default async function Home() {
  const [workshopsThisWeek, artistsCount] = await Promise.all([
    getWorkshopsThisWeekCount(),
    getArtistsCount(),
  ]);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <WorkshopsSection workshopsThisWeek={workshopsThisWeek} artistsCount={artistsCount} />
      <ShowsSection />
      <CommunitySection />
      <InstagramSection />
    </main>
  );
}
