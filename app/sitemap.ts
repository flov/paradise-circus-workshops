import { MetadataRoute } from "next";
import { db } from "@/db";
import { events, users } from "@/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { createEventSlug } from "@/lib/utils";
import { unstable_cache } from "next/cache";

export const revalidate = 3600;

const staticPages = (
  baseUrl: string,
): MetadataRoute.Sitemap => [
  {
    url: baseUrl,
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${baseUrl}/timetable`,
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/artists`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/about`,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${baseUrl}/faq`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

const getCachedSitemapEntries = unstable_cache(
  async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split("T")[0];

    const publishedEvents = await db
      .select({
        id: events.id,
        title: events.title,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        updatedAt: events.updatedAt,
        instructorProfile: {
          displayName: users.displayName,
          username: users.username,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(and(eq(events.isPublished, true), gte(events.date, dateString)));

    const eventPages: MetadataRoute.Sitemap = publishedEvents.map((event) => {
      const instructorName = event.instructorProfile
        ? event.instructorProfile.displayName || event.instructorProfile.username
        : event.instructor || "";

      const slug = createEventSlug(event.id, event.title, instructorName);

      return {
        url: `${baseUrl}/event/${slug}`,
        lastModified: event.updatedAt || undefined,
        changeFrequency: "weekly" as const,
        priority: 0.3,
      };
    });

    const allUsers = await db
      .select({
        username: users.username,
        updatedAt: users.updatedAt,
      })
      .from(users);

    const artistPages: MetadataRoute.Sitemap = allUsers.map((user) => ({
      url: `${baseUrl}/artists/${user.username}`,
      lastModified: user.updatedAt || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));

    return [...staticPages(baseUrl), ...artistPages, ...eventPages];
  },
  ["sitemap-entries"],
  { revalidate: 3600, tags: ["events", "artists"] },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://paradise-circus.app";

  try {
    return await getCachedSitemapEntries(baseUrl);
  } catch (error) {
    console.error("Sitemap database error, returning static pages only:", error);
    return staticPages(baseUrl);
  }
}
