"use server"

import { db } from "@/db"
import { users, userProps } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"
import { validateUsername, extractYouTubeId } from "@/lib/utils"

/**
 * Create a basic user record (called from onboarding)
 */
export async function createUserRecord(clerkUserId: string, username: string, isArtist: boolean) {
  try {
    // Validate username
    const validation = validateUsername(username)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Check if username is available
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username.trim()))
      .limit(1)

    if (existingUser.length > 0) {
      return { success: false, error: "Username is already taken" }
    }

    // Check if user already exists
    const existingClerkUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1)

    if (existingClerkUser.length > 0) {
      return { success: false, error: "User record already exists" }
    }

    // Create user record
    const result = await db
      .insert(users)
      .values({
        clerkUserId,
        username: username.trim(),
        isArtist,
      })
      .returning({ id: users.id, username: users.username })

    return { success: true, userId: result[0].id, username: result[0].username }
  } catch (error) {
    console.error("Create user record error:", error)
    return { success: false, error: "Failed to create user record" }
  }
}

/**
 * Create or update artist profile
 */
export async function createProfile(formData: FormData) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in" }
  }

  try {
    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (userRecord.length === 0) {
      return { success: false, error: "User record not found. Please complete onboarding first." }
    }

    const user = userRecord[0]

    if (!user.isArtist) {
      return { success: false, error: "Only artists can create profiles" }
    }

    // Get form data
    const username = formData.get("username") as string
    const bio = formData.get("bio") as string
    const instagramHandle = formData.get("instagramHandle") as string
    const isInstructor = formData.get("isInstructor") === "true"
    const yearsOfExperience = formData.get("yearsOfExperience") as string
    const performanceStyle = formData.get("performanceStyle") as string
    const availableForPerformances = formData.get("availableForPerformances") === "true"
    const location = formData.get("location") as string
    const youtubeVideosInput = formData.get("youtubeVideos") as string

    // Validate username if changed
    if (username !== user.username) {
      const validation = validateUsername(username)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Check if new username is available
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username.trim()))
        .limit(1)

      if (existingUser.length > 0 && existingUser[0].id !== user.id) {
        return { success: false, error: "Username is already taken" }
      }
    }

    // Process YouTube videos
    let youtubeVideos: string[] | null = null
    if (youtubeVideosInput) {
      const videoIds = youtubeVideosInput
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => extractYouTubeId(v))
        .filter((id): id is string => id !== null)
      
      youtubeVideos = videoIds.length > 0 ? videoIds : null
    }

    // Update user profile
    await db
      .update(users)
      .set({
        username: username.trim(),
        bio: bio || null,
        instagramHandle: instagramHandle || null,
        isInstructor,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : null,
        performanceStyle: performanceStyle || null,
        availableForPerformances,
        location: location || null,
        youtubeVideos,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Handle props
    const propsJson = formData.get("props") as string
    if (propsJson) {
      try {
        const props = JSON.parse(propsJson) as Array<{ propName: string; skillLevel: number }>
        
        // Delete existing props
        await db.delete(userProps).where(eq(userProps.userId, user.id))
        
        // Insert new props
        if (props.length > 0) {
          await db.insert(userProps).values(
            props.map((prop) => ({
              userId: user.id,
              propName: prop.propName.trim(),
              skillLevel: Math.max(0, Math.min(10, prop.skillLevel)),
            }))
          )
        }
      } catch (error) {
        console.error("Error processing props:", error)
      }
    }

    revalidatePath(`/artist/${username.trim()}`)
    revalidatePath("/profile/edit")
    
    return { success: true, username: username.trim() }
  } catch (error) {
    console.error("Create profile error:", error)
    return { success: false, error: "Failed to create profile" }
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
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error("Get user by username error:", error)
    return null
  }
}

/**
 * Get user props
 */
export async function getUserProps(userId: number) {
  try {
    const result = await db
      .select()
      .from(userProps)
      .where(eq(userProps.userId, userId))
      .orderBy(asc(userProps.propName))

    return result
  } catch (error) {
    console.error("Get user props error:", error)
    return []
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error("Get current user profile error:", error)
    return null
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
      .limit(1)

    return result.length > 0
  } catch (error) {
    console.error("Has user record error:", error)
    return false
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
      .limit(1)

    return result.length > 0 && result[0].isArtist === true
  } catch (error) {
    console.error("Is user artist error:", error)
    return false
  }
}
