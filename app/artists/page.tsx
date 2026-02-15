import type { Metadata } from "next";
import { db } from "@/db";
import { users, userProps, props, events } from "@/db/schema";
import { eq, sql, asc, and, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { ArtistList } from "@/components/artist-list";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | Artists",
  },
};

// ISR: Revalidate every hour
export const revalidate = 3600;

async function getAllArtistsUncached() {
  // Get all users with their props and workshop counts
  const artistsData = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      username: users.username,
      displayName: users.displayName,
      isInstructor: users.isInstructor,
      isAdmin: users.isAdmin,
      avatarImageUrl: users.avatarImageUrl,
      bio: users.bio,
      youtubeVideos: users.youtubeVideos,
      vimeoVideos: users.vimeoVideos,
      patreonPage: users.patreonPage,
      instagramHandle: users.instagramHandle,
      availableForPerformances: users.availableForPerformances,
      createdAt: users.createdAt,
    })
    .from(users);

  // Get props for each artist
  const artistIds = artistsData.map((a) => a.id);
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
      : [];

  // Get workshop counts for each artist
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
      : [];

  // Group props by userId with skill levels
  const propsByUserId = userPropsData.reduce(
    (acc, item) => {
      if (!acc[item.userId]) {
        acc[item.userId] = [];
      }
      acc[item.userId].push({
        name: item.propName,
        skillLevel: item.skillLevel,
      });
      return acc;
    },
    {} as Record<number, Array<{ name: string; skillLevel: number }>>,
  );

  // Create workshop counts map
  const workshopCountsByUserId = workshopCountsData.reduce(
    (acc, item) => {
      if (item.instructorId) {
        acc[item.instructorId] = Number(item.count);
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  // Combine all data
  const artists = artistsData.map((artist) => {
    const youtubeCount = artist.youtubeVideos?.length || 0;
    const vimeoCount = artist.vimeoVideos?.length || 0;
    const videoCount = youtubeCount + vimeoCount;

    return {
      id: artist.id.toString(),
      name: artist.displayName || artist.username,
      avatar: artist.avatarImageUrl || undefined,
      isInstructor: artist.isInstructor,
      isAdmin: artist.isAdmin || false,
      workshopCount: workshopCountsByUserId[artist.id] || 0,
      props: propsByUserId[artist.id] || [],
      username: artist.username,
      videoCount,
      bio: artist.bio || undefined,
      patreonPage: artist.patreonPage || undefined,
      instagramHandle: artist.instagramHandle || undefined,
      availableForPerformances: artist.availableForPerformances || false,
      createdAt: artist.createdAt,
    };
  });

  return artists;
}

const getAllArtists = unstable_cache(
  getAllArtistsUncached,
  ["artists-list"],
  { revalidate: 3600, tags: ["artists"] }
);

export default async function ArtistsPage() {
  const artists = await getAllArtists();

  return (
    <div className="container mx-auto max-w-7xl py-4 px-4">
      <ArtistList artists={artists} />
    </div>
  );
}
