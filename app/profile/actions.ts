"use server";

import { db } from "@/db";
import { users, userProps, props, events } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { validateUsername, extractYouTubeId, validateInstagramHandle, normalizeExperienceStartDate } from "@/lib/utils";
import type { UserProfile, UserProp, PropOption } from "@/lib/types";

/**
 * Create a basic user record (called from onboarding)
 */
export async function createUserRecord(
  clerkUserId: string,
  username: string,
) {
  try {
    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
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

    // Create user record - database unique constraint will handle race conditions
    const trimmedUsername = username.trim();
    try {
      const result = await db
        .insert(users)
        .values({
          clerkUserId,
          username: trimmedUsername,
        })
        .returning({ id: users.id, username: users.username });
      
      return {
        success: true,
        userId: result[0].id,
        username: result[0].username,
      };
    } catch (error: unknown) {
      // Handle unique constraint violation (race condition or duplicate username)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || 
          (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')) {
        // Check if it's username or clerkUserId conflict
        const existingUser = await db
          .select({ id: users.id, clerkUserId: users.clerkUserId })
          .from(users)
          .where(eq(users.username, trimmedUsername))
          .limit(1);
        
        if (existingUser.length > 0) {
          return { success: false, error: "Username is already taken" };
        }
        return { success: false, error: "User record already exists" };
      }
      throw error;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Create user record error:", error);
    
    // Return more specific error if available
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return { success: false, error: "Username is already taken" };
    }
    
    return { success: false, error: "Failed to create user record. Please try again." };
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

    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Validate Instagram handle
    if (instagramHandle) {
      const instagramValidation = validateInstagramHandle(instagramHandle);
      if (!instagramValidation.isValid) {
        return { success: false, error: instagramValidation.error };
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

    // Normalize Instagram handle (remove @ if present)
    const normalizedInstagramHandle = instagramHandle 
      ? instagramHandle.replace(/^@/, '').trim() || null 
      : null;

    // Normalize experience start date
    const normalizedExperienceDate = normalizeExperienceStartDate(
      experienceStartDateInput || null
    );

    let user: { id: number; username: string };

    if (userRecord.length === 0) {
      // Create new user record with all profile data
      try {
        const trimmedUsername = username.trim();
        const result = await db
          .insert(users)
          .values({
            clerkUserId: userId,
            username: trimmedUsername,
            bio: bio || null,
            instagramHandle: normalizedInstagramHandle,
            isInstructor,
            experienceStartDate: normalizedExperienceDate,
            performanceStyle: performanceStyle || null,
            availableForPerformances,
            location: location || null,
            youtubeVideos,
          })
          .returning({ id: users.id, username: users.username });
        
        user = result[0];
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Handle unique constraint violation for username
        if (errorMessage.includes('unique') || errorMessage.includes('duplicate') ||
            (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')) {
          return { success: false, error: "Username is already taken. Please choose another." };
        }
        throw error;
      }
    } else {
      // Update existing user record
      const existingUser = userRecord[0];
      
      // Validate username if changed
      if (username.trim() !== existingUser.username) {
        const validation = validateUsername(username);
        if (!validation.isValid) {
          return { success: false, error: validation.error };
        }
      }

      try {
        await db
          .update(users)
          .set({
            username: username.trim(),
            bio: bio || null,
            instagramHandle: normalizedInstagramHandle,
            isInstructor,
            experienceStartDate: normalizedExperienceDate,
            performanceStyle: performanceStyle || null,
            availableForPerformances,
            location: location || null,
            youtubeVideos,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
        
        user = { id: existingUser.id, username: username.trim() };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Handle unique constraint violation for username
        if (errorMessage.includes('unique') || errorMessage.includes('duplicate') ||
            (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')) {
          return { success: false, error: "Username is already taken. Please choose another." };
        }
        throw error;
      }
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

        // Insert new props
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
                };
              }),
          );

          if (propEntries.length > 0) {
            await db.insert(userProps).values(propEntries);
          }
        }
      } catch (error) {
        console.error("Error processing props:", error);
      }
    }

    revalidatePath(`/artist/${username.trim()}`);
    revalidatePath("/profile/edit");
    revalidatePath("/onboarding");

    return { success: true, username: username.trim() };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Create profile error:", error);
    
    // Provide more specific error messages
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return { success: false, error: "Username is already taken. Please choose another." };
    }
    if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      return { success: false, error: "Invalid data provided. Please check your inputs and try again." };
    }
    
    return { success: false, error: "Failed to save profile. Please try again." };
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
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
    // Normalize experienceStartDate to string format
    const normalizedUser: UserProfile = {
      ...user,
      experienceStartDate: normalizeExperienceStartDate(user.experienceStartDate),
    };

    return normalizedUser;
  } catch (error: unknown) {
    console.error("Get user by username error:", error);
    return null;
  }
}

/**
 * Get all available props (for autocomplete)
 */
export async function getAllProps(): Promise<PropOption[]> {
  try {
    const result = await db
      .select({
        id: props.id,
        name: props.name,
      })
      .from(props)
      .orderBy(asc(props.name));

    return result;
  } catch (error: unknown) {
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

  // Create new prop - always use lowercase to prevent duplicates
  const result = await db
    .insert(props)
    .values({ name: normalizedName })
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
export async function getUserProps(userId: number): Promise<UserProp[]> {
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
  } catch (error: unknown) {
    console.error("Get user props error:", error);
    return [];
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const result = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        username: users.username,
        isInstructor: users.isInstructor,
        isAdmin: users.isAdmin,
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

    const user = result[0];
    // Normalize experienceStartDate to string format
    const normalizedUser: UserProfile = {
      ...user,
      experienceStartDate: normalizeExperienceStartDate(user.experienceStartDate),
    };

    return normalizedUser;
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error("Has user record error:", error);
    return false;
  }
}

/**
 * Get profile links data for current user
 */
export async function getProfileLinksData(): Promise<{
  username: string | null;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { username: null };
  }

  try {
    const profile = await getCurrentUserProfile();

    return {
      username: profile?.username || null,
    };
  } catch (error: unknown) {
    console.error("Get profile links data error:", error);
    return { username: null };
  }
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const result = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    return result.length > 0 && result[0].isAdmin === true;
  } catch (error: unknown) {
    console.error("Check admin status error:", error);
    return false;
  }
}

/**
 * Check if current user is an instructor
 */
export async function isInstructor(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const result = await db
      .select({ isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    return result.length > 0 && result[0].isInstructor === true;
  } catch (error: unknown) {
    console.error("Check instructor status error:", error);
    return false;
  }
}

/**
 * Check if current user can manage a specific event
 * Returns true if user is admin OR (user is instructor AND event's instructor matches user's username)
 */
export async function canManageEvent(eventId: number): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    // Check if user is admin
    const adminCheck = await isAdmin();
    if (adminCheck) {
      return true;
    }

    // Check if user is instructor and matches event's instructor
    const userResult = await db
      .select({ username: users.username, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      return false;
    }

    const eventResult = await db
      .select({ instructor: events.instructor })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (eventResult.length === 0) {
      return false;
    }

    // Match instructor string with username
    return eventResult[0].instructor === userResult[0].username;
  } catch (error: unknown) {
    console.error("Check event management permission error:", error);
    return false;
  }
}
