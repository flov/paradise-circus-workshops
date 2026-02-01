import { MetadataRoute } from 'next'
import { db } from '@/db'
import { events, users } from '@/db/schema'
import { eq, gte, and } from 'drizzle-orm'
import { createEventSlug } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://paradise-circus.app'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/timetable`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/instagram`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // Get all published events (including future and recent past events for SEO)
  // Include events from the last 30 days to ensure recent content is indexed
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateString = thirtyDaysAgo.toISOString().split('T')[0]

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
    .where(and(eq(events.isPublished, true), gte(events.date, dateString)))

  // Generate event URLs
  const eventPages: MetadataRoute.Sitemap = publishedEvents.map((event) => {
    const instructorName = event.instructorProfile
      ? (event.instructorProfile.displayName || event.instructorProfile.username)
      : event.instructor || ''
    
    const slug = createEventSlug(event.id, event.title, instructorName)
    
    return {
      url: `${baseUrl}/event/${slug}`,
      lastModified: event.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  })

  // Get all users (artists) for artist profile pages
  const allUsers = await db
    .select({
      username: users.username,
      updatedAt: users.updatedAt,
    })
    .from(users)

  // Generate artist profile URLs
  const artistPages: MetadataRoute.Sitemap = allUsers.map((user) => ({
    url: `${baseUrl}/artists/${user.username}`,
    lastModified: user.updatedAt || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...eventPages, ...artistPages]
}
