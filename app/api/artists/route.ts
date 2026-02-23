import { db } from "@/db"
import { users, userProps, props, events } from "@/db/schema"
import { eq, sql, and, inArray } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { corsJson, corsOptions } from "@/lib/cors"

async function getAllArtistsUncached() {
  const artistsData = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isInstructor: users.isInstructor,
      avatarImageUrl: users.avatarImageUrl,
      bio: users.bio,
      youtubeVideos: users.youtubeVideos,
      vimeoVideos: users.vimeoVideos,
      instagramHandle: users.instagramHandle,
      availableForPerformances: users.availableForPerformances,
    })
    .from(users)

  const artistIds = artistsData.map((a) => a.id)

  const userPropsData =
    artistIds.length > 0
      ? await db
          .select({
            userId: userProps.userId,
            propName: props.name,
            skillLevel: userProps.skillLevel,
          })
          .from(userProps)
          .innerJoin(props, eq(userProps.propId, props.id))
          .where(inArray(userProps.userId, artistIds))
      : []

  const workshopCountsData =
    artistIds.length > 0
      ? await db
          .select({
            instructorId: events.instructorId,
            count: sql<number>`COUNT(*)`.as("count"),
          })
          .from(events)
          .where(
            and(
              inArray(events.instructorId, artistIds),
              eq(events.isWorkshop, true),
            ),
          )
          .groupBy(events.instructorId)
      : []

  const propsByUserId = userPropsData.reduce(
    (acc, item) => {
      if (!acc[item.userId]) acc[item.userId] = []
      acc[item.userId].push({ name: item.propName, skillLevel: item.skillLevel })
      return acc
    },
    {} as Record<number, Array<{ name: string; skillLevel: number }>>,
  )

  const workshopCountsByUserId = workshopCountsData.reduce(
    (acc, item) => {
      if (item.instructorId) acc[item.instructorId] = Number(item.count)
      return acc
    },
    {} as Record<number, number>,
  )

  return artistsData.map((artist) => {
    const youtubeCount = artist.youtubeVideos?.length || 0
    const vimeoCount = artist.vimeoVideos?.length || 0

    return {
      id: artist.id.toString(),
      name: artist.displayName || artist.username,
      avatar: artist.avatarImageUrl || undefined,
      username: artist.username,
      isInstructor: artist.isInstructor,
      workshopCount: workshopCountsByUserId[artist.id] || 0,
      props: propsByUserId[artist.id] || [],
      videoCount: youtubeCount + vimeoCount,
      bio: artist.bio || undefined,
      instagramHandle: artist.instagramHandle || undefined,
      availableForPerformances: artist.availableForPerformances || false,
    }
  })
}

const getAllArtists = unstable_cache(
  getAllArtistsUncached,
  ["api-artists-list"],
  { revalidate: 3600, tags: ["artists"] },
)

/**
 * List all artists (instructors and performers)
 * @description Returns all artists with their props, workshop counts, and profile info. Used by the mobile app and artists page.
 * @response artistsListResponseSchema
 * @responseSet public
 */
export async function GET() {
  try {
    const artists = await getAllArtists()
    return corsJson(artists)
  } catch (error) {
    console.error("API artists error:", error)
    return corsJson({ error: "Failed to fetch artists" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return corsOptions()
}
