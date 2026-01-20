import { db } from "@/db";
import { users, userProps, props, events } from "@/db/schema";
import { eq, sql, asc, and, inArray } from "drizzle-orm";
import { ArtistList } from "@/components/artist-list";

async function getAllArtists() {
  // Get all users with their props and workshop counts
  const artistsData = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      username: users.username,
      displayName: users.displayName,
      isInstructor: users.isInstructor,
      avatarImageUrl: users.avatarImageUrl,
      youtubeVideos: users.youtubeVideos,
      vimeoVideos: users.vimeoVideos,
    })
    .from(users)
    .orderBy(asc(users.displayName), asc(users.username));

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
      workshopCount: workshopCountsByUserId[artist.id] || 0,
      props: propsByUserId[artist.id] || [],
      username: artist.username,
      videoCount,
    };
  });

  return artists;
}

export default async function ArtistsPage() {
  const artists = await getAllArtists();

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <ArtistList artists={artists} />
    </div>
  );
}
