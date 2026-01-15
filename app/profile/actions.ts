"use server";

import { db } from "@/db";
import { users, userProps, props } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { validateUsername, extractYouTubeId } from "@/lib/utils";

/**
 * Create a basic user record (called from onboarding)
 */
export async function createUserRecord(
  clerkUserId: string,
  username: string,
  isArtist: boolean,
) {
  try {
    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if username is available
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username.trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "Username is already taken" };
    }

    // Check if user already exists
    const existingClerkUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existingClerkUser.length > 0) {
      return { success: false, error: "User record already exists" };
    }

    // Create user record
    const result = await db
      .insert(users)
      .values({
        clerkUserId,
        username: username.trim(),
        isArtist,
      })
      .returning({ id: users.id, username: users.username });

    return {
      success: true,
      userId: result[0].id,
      username: result[0].username,
    };
  } catch (error) {
    console.error("Create user record error:", error);
    return { success: false, error: "Failed to create user record" };
  }
}

/**
 * Create or update artist profile
 */
export async function createProfile(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return {
        success: false,
        error: "User record not found. Please complete onboarding first.",
      };
    }

    const user = userRecord[0];

    if (!user.isArtist) {
      return { success: false, error: "Only artists can create profiles" };
    }

    // Get form data
    const username = formData.get("username") as string;
    const bio = formData.get("bio") as string;
    const instagramHandle = formData.get("instagramHandle") as string;
    const isInstructor = formData.get("isInstructor") === "true";
    const experienceStartDateInput = formData.get(
      "experienceStartDate",
    ) as string;
    const performanceStyle = formData.get("performanceStyle") as string;
    const availableForPerformances =
      formData.get("availableForPerformances") === "true";
    const location = formData.get("location") as string;
    const youtubeVideosInput = formData.get("youtubeVideos") as string;

    // Validate username if changed
    if (username !== user.username) {
      const validation = validateUsername(username);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Check if new username is available
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username.trim()))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== user.id) {
        return { success: false, error: "Username is already taken" };
      }
    }

    // Process YouTube videos
    let youtubeVideos: string[] | null = null;
    if (youtubeVideosInput) {
      const videoIds = youtubeVideosInput
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => extractYouTubeId(v))
        .filter((id): id is string => id !== null);

      youtubeVideos = videoIds.length > 0 ? videoIds : null;
    }

    // Update user profile
    try {
      await db
        .update(users)
        .set({
          username: username.trim(),
          bio: bio || null,
          instagramHandle: instagramHandle || null,
          isInstructor,
          experienceStartDate: experienceStartDateInput || null,
          performanceStyle: performanceStyle || null,
          availableForPerformances,
          location: location || null,
          youtubeVideos,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    } catch (error: any) {
      throw error;
    }

    // Handle props
    const propsJson = formData.get("props") as string;
    if (propsJson) {
      try {
        const propsData = JSON.parse(propsJson) as Array<{
          propName: string;
          skillLevel: number;
        }>;

        // Delete existing props
        await db.delete(userProps).where(eq(userProps.userId, user.id));

        // Insert new props - handle migration transition where both columns may exist
        if (propsData.length > 0) {
          const propEntries = await Promise.all(
            propsData
              .filter((p) => p.propName && p.propName.trim())
              .map(async (prop) => {
                const propId = await getOrCreateProp(prop.propName);
                return {
                  userId: user.id,
                  propId,
                  skillLevel: Math.max(0, Math.min(10, prop.skillLevel)),
                  propName: prop.propName.trim(), // Keep propName for migration transition
                };
              }),
          );

          if (propEntries.length > 0) {
            try {
              // Try inserting with propId only (after migration complete)
              await db
                .insert(userProps)
                .values(propEntries.map(({ propName, ...rest }) => rest));
            } catch (insertError: any) {
              // If prop_name is still required (during migration), include both columns
              if (
                insertError?.code === "23502" &&
                insertError?.column === "prop_name"
              ) {
                await db.insert(userProps).values(propEntries as any);
              } else if (
                insertError?.code === "23502" &&
                insertError?.column === "prop_id"
              ) {
                // If prop_id doesn't exist yet (before migration), use old schema only
                await db.insert(userProps).values(
                  propsData
                    .filter((p) => p.propName && p.propName.trim())
                    .map((prop) => ({
                      userId: user.id,
                      propName: prop.propName.trim(),
                      skillLevel: Math.max(0, Math.min(10, prop.skillLevel)),
                    })) as any,
                );
              } else {
                throw insertError;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing props:", error);
      }
    }

    revalidatePath(`/artist/${username.trim()}`);
    revalidatePath("/profile/edit");

    return { success: true, username: username.trim() };
  } catch (error) {
    console.error("Create profile error:", error);
    return { success: false, error: "Failed to create profile" };
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    // Ensure experienceStartDate is a string if present (Drizzle returns date as string)
    // Handle Date objects if they occur during serialization
    if (
      user.experienceStartDate &&
      typeof user.experienceStartDate !== "string"
    ) {
      const dateValue = user.experienceStartDate as unknown;
      if (dateValue instanceof Date) {
        (user as any).experienceStartDate = dateValue
          .toISOString()
          .split("T")[0];
      } else if (dateValue !== null && dateValue !== undefined) {
        (user as any).experienceStartDate = String(dateValue);
      }
    }

    return user;
  } catch (error) {
    console.error("Get user by username error:", error);
    return null;
  }
}

/**
 * Get all available props (for autocomplete)
 */
export async function getAllProps() {
  try {
    const result = await db
      .select({
        id: props.id,
        name: props.name,
      })
      .from(props)
      .orderBy(asc(props.name));

    return result;
  } catch (error) {
    console.error("Get all props error:", error);
    return [];
  }
}

/**
 * Get or create a prop by name (case-insensitive)
 */
async function getOrCreateProp(propName: string): Promise<number> {
  const normalizedName = propName.trim().toLowerCase();

  // Try to find existing prop
  const existing = await db
    .select({ id: props.id })
    .from(props)
    .where(sql`LOWER(${props.name}) = ${normalizedName}`)
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new prop
  const result = await db
    .insert(props)
    .values({ name: propName.trim() })
    .returning({ id: props.id })
    .onConflictDoUpdate({
      target: props.name,
      set: { name: sql`EXCLUDED.name` },
    });

  return result[0].id;
}

/**
 * Get user props with prop names joined
 */
export async function getUserProps(userId: number) {
  try {
    const result = await db
      .select({
        id: userProps.id,
        userId: userProps.userId,
        propId: userProps.propId,
        propName: props.name,
        skillLevel: userProps.skillLevel,
        createdAt: userProps.createdAt,
      })
      .from(userProps)
      .innerJoin(props, eq(userProps.propId, props.id))
      .where(eq(userProps.userId, userId))
      .orderBy(asc(props.name));

    return result;
  } catch (error) {
    console.error("Get user props error:", error);
    // Fallback: try to get props without join (for backward compatibility during migration)
    try {
      const result = await db
        .select()
        .from(userProps)
        .where(eq(userProps.userId, userId));
      return result.map((r: any) => ({
        ...r,
        propName: r.propName || "Unknown",
      }));
    } catch {
      return [];
    }
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    // Try to select with experienceStartDate first (after migration)
    try {
      const result = await db
        .select({
          id: users.id,
          clerkUserId: users.clerkUserId,
          username: users.username,
          isArtist: users.isArtist,
          isInstructor: users.isInstructor,
          bio: users.bio,
          instagramHandle: users.instagramHandle,
          youtubeVideos: users.youtubeVideos,
          experienceStartDate: users.experienceStartDate,
          performanceStyle: users.performanceStyle,
          availableForPerformances: users.availableForPerformances,
          location: users.location,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const user = result[0] as any;
      // Ensure experienceStartDate is a string if present
      if (
        user.experienceStartDate &&
        typeof user.experienceStartDate !== "string"
      ) {
        const dateValue = user.experienceStartDate as unknown;
        if (dateValue instanceof Date) {
          user.experienceStartDate = dateValue.toISOString().split("T")[0];
        } else if (dateValue !== null && dateValue !== undefined) {
          user.experienceStartDate = String(dateValue);
        }
      }

      return user;
    } catch (selectError: any) {
      // If experienceStartDate column doesn't exist yet (before migration), select without it
      if (
        selectError?.message?.includes("experience_start_date") ||
        selectError?.code === "42703"
      ) {
        const result = await db
          .select({
            id: users.id,
            clerkUserId: users.clerkUserId,
            username: users.username,
            isArtist: users.isArtist,
            isInstructor: users.isInstructor,
            bio: users.bio,
            instagramHandle: users.instagramHandle,
            youtubeVideos: users.youtubeVideos,
            performanceStyle: users.performanceStyle,
            availableForPerformances: users.availableForPerformances,
            location: users.location,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);

        if (result.length === 0) {
          return null;
        }

        const user = result[0] as any;
        user.experienceStartDate = null; // Column doesn't exist yet
        return user;
      }
      throw selectError;
    }
  } catch (error) {
    console.error("Get current user profile error:", error);
    return null;
  }
}

/**
 * Check if user has a profile
 */
export async function hasUserRecord(clerkUserId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Has user record error:", error);
    return false;
  }
}

/**
 * Check if user is an artist
 */
export async function isUserArtist(clerkUserId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ isArtist: users.isArtist })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return result.length > 0 && result[0].isArtist === true;
  } catch (error) {
    console.error("Is user artist error:", error);
    return false;
  }
}
