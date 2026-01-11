"use server"

import { db } from "@/db"
import { events, bookings } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createEventSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"

export async function createEvent(formData: FormData) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to create events." }
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
    await db.insert(events).values({
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
    console.error("Error creating event:", error)
    return { success: false, error: "Failed to create event" }
  }
}

export async function updateEvent(formData: FormData) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to update events." }
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
      .update(events)
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
      .where(eq(events.id, parseInt(id)))

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/event/${createEventSlug(parseInt(id), title, instructor)}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating event:", error)
    return { success: false, error: "Failed to update event" }
  }
}

export async function deleteEvent(eventId: number) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete events.")
  }

  try {
    await db.delete(events).where(eq(events.id, eventId))

    revalidatePath("/admin")
    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting workshop:", error)
    throw error
  }
}

export async function deleteBooking(bookingId: number, eventId: number) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete bookings.")
  }

  try {
    // Fetch event title and instructor for revalidation
    const eventResults = await db
      .select({ title: events.title, instructor: events.instructor })
      .from(events)
      .where(eq(events.id, eventId))

    await db.delete(bookings).where(eq(bookings.id, bookingId))

    // Update event booking count
    await db
      .update(events)
      .set({ currentBookings: sql`${events.currentBookings} - 1` })
      .where(eq(events.id, eventId))

    revalidatePath("/admin")
    revalidatePath("/")
    if (eventResults.length > 0) {
      revalidatePath(`/event/${createEventSlug(eventId, eventResults[0].title, eventResults[0].instructor)}`)
    }
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw error
  }
}
