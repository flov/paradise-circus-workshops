"use server"

import { db } from "@/db"
import { events, bookings, eventProps, props, users } from "@/db/schema"
import { eq, sql, inArray, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createEventSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, isInstructor } from "@/app/profile/actions"

export async function createEvent(formData: FormData) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to create events." }
  }

  // Check authorization: must be instructor OR admin
  const userIsAdmin = await isAdmin()
  const userIsInstructor = await isInstructor()
  
  if (!userIsAdmin && !userIsInstructor) {
    return { success: false, error: "Unauthorized. Only instructors and admins can create events." }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const whatToBring = formData.get("whatToBring") as string
  const propsInput = formData.get("props") as string
  const isWorkshop = formData.get("isWorkshop") === "on" || formData.get("isWorkshop") === "true"
  if (!title || !description || !instructor || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    // Insert event
    const [newEvent] = await db.insert(events).values({
      title,
      description,
      instructor,
      date,
      startTime: start_time,
      endTime: end_time,
      location,
      whatToBring: whatToBring || null,
      isWorkshop,
    }).returning({ id: events.id })

    // Handle event props
    if (propsInput && newEvent) {
      try {
        const propIds = JSON.parse(propsInput) as number[]
        if (propIds.length > 0) {
          await db.insert(eventProps).values(
            propIds.map(propId => ({
              eventId: newEvent.id,
              propId,
            }))
          )
        }
      } catch (error) {
        console.error("Error processing event props:", error)
      }
    }

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
  const propsInput = formData.get("props") as string
  const isWorkshop = formData.get("isWorkshop") === "on" || formData.get("isWorkshop") === "true"
  if (!id || !title || !description || !instructor || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  const eventId = parseInt(id)

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin()
  
  if (!userIsAdmin) {
    // Check if user is instructor and matches event's instructor
    const userResult = await db
      .select({ username: users.username, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      return { success: false, error: "Unauthorized. Only admins and event instructors can update events." }
    }

    // Fetch event to check instructor
    const eventResult = await db
      .select({ instructor: events.instructor })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found." }
    }

    // Match instructor string with username
    if (eventResult[0].instructor !== userResult[0].username) {
      return { success: false, error: "Unauthorized. You can only update events you are instructing." }
    }
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
        isWorkshop,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(events.id, eventId))

    // Handle event props
    if (propsInput !== null) {
      try {
        // Delete existing props
        await db.delete(eventProps).where(eq(eventProps.eventId, eventId))
        
        // Insert new props
        const propIds = JSON.parse(propsInput) as number[]
        if (propIds.length > 0) {
          await db.insert(eventProps).values(
            propIds.map(propId => ({
              eventId,
              propId,
            }))
          )
        }
      } catch (error) {
        console.error("Error processing event props:", error)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/event/${createEventSlug(eventId, title, instructor)}`)

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

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin()
  
  if (!userIsAdmin) {
    // Check if user is instructor and matches event's instructor
    const userResult = await db
      .select({ username: users.username, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      throw new Error("Unauthorized. Only admins and event instructors can delete events.")
    }

    // Fetch event to check instructor
    const eventResult = await db
      .select({ instructor: events.instructor })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      throw new Error("Event not found.")
    }

    // Match instructor string with username
    if (eventResult[0].instructor !== userResult[0].username) {
      throw new Error("Unauthorized. You can only delete events you are instructing.")
    }
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

/**
 * Get event props
 */
export async function getEventProps(eventId: number) {
  try {
    const result = await db
      .select({
        id: eventProps.id,
        eventId: eventProps.eventId,
        propId: eventProps.propId,
        propName: props.name,
        createdAt: eventProps.createdAt,
      })
      .from(eventProps)
      .innerJoin(props, eq(eventProps.propId, props.id))
      .where(eq(eventProps.eventId, eventId))
      .orderBy(asc(props.name))

    return result
  } catch (error) {
    console.error("Get event props error:", error)
    return []
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
