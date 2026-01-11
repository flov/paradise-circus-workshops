"use server"

import { db } from "@/db"
import { workshops, bookings } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createWorkshopSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"

export async function createWorkshop(formData: FormData) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to create workshops." }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const whatToBring = formData.get("whatToBring") as string
  if (!title || !description || !instructor || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    await db.insert(workshops).values({
      title,
      description,
      instructor,
      date,
      startTime: start_time,
      endTime: end_time,
      location,
      whatToBring: whatToBring || null,
    })

    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error creating workshop:", error)
    return { success: false, error: "Failed to create workshop" }
  }
}

export async function updateWorkshop(formData: FormData) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to update workshops." }
  }

  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const whatToBring = formData.get("whatToBring") as string
  if (!id || !title || !description || !instructor || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    await db
      .update(workshops)
      .set({
        title,
        description,
        instructor,
        date,
        startTime: start_time,
        endTime: end_time,
        location,
        whatToBring: whatToBring || null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(workshops.id, parseInt(id)))

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/event/${createWorkshopSlug(parseInt(id), title, instructor)}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating workshop:", error)
    return { success: false, error: "Failed to update workshop" }
  }
}

export async function deleteWorkshop(workshopId: number) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete workshops.")
  }

  try {
    await db.delete(workshops).where(eq(workshops.id, workshopId))

    revalidatePath("/admin")
    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting workshop:", error)
    throw error
  }
}

export async function deleteBooking(bookingId: number, workshopId: number) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete bookings.")
  }

  try {
    // Fetch workshop title and instructor for revalidation
    const workshopResults = await db
      .select({ title: workshops.title, instructor: workshops.instructor })
      .from(workshops)
      .where(eq(workshops.id, workshopId))

    await db.delete(bookings).where(eq(bookings.id, bookingId))

    // Update workshop booking count
    await db
      .update(workshops)
      .set({ currentBookings: sql`${workshops.currentBookings} - 1` })
      .where(eq(workshops.id, workshopId))

    revalidatePath("/admin")
    revalidatePath("/")
    if (workshopResults.length > 0) {
      revalidatePath(`/event/${createWorkshopSlug(workshopId, workshopResults[0].title, workshopResults[0].instructor)}`)
    }
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw error
  }
}
