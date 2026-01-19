"use server"

import { randomUUID } from "crypto"
import { db } from "@/db"
import { events, bookings } from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserName, getUserEmail, createEventSlug } from "@/lib/utils"

export async function createBooking(formData: FormData) {
  // Get authenticated user
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to book an event" }
  }

  const user = await currentUser()
  if (!user) {
    return { success: false, error: "Unable to retrieve user information" }
  }

  // Get user's name and email from Clerk, fallback to form data
  let clerkName = getUserName(user)
  const clerkEmail = getUserEmail(user)

  // Try to get displayName from database, fallback to Clerk firstName/username
  try {
    const { users } = await import("@/db/schema")
    const userRecord = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)
    
    if (userRecord.length > 0 && userRecord[0].displayName) {
      clerkName = userRecord[0].displayName
    }
  } catch (error) {
    // If database lookup fails, fall back to Clerk name
    console.error("Failed to fetch user displayName:", error)
  }

  const eventId = formData.get("eventId") as string
  const formName = formData.get("name") as string
  const formEmail = formData.get("email") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  // Use Clerk data if available, otherwise fallback to form data
  const name = clerkName || formName
  const email = clerkEmail || formEmail

  // Validate required fields
  if (!eventId || !name || !email) {
    return { success: false, error: "Missing required fields. Please ensure you have a name and email." }
  }

  try {
    // Check if event exists
    const eventResults = await db
      .select({
        id: events.id,
        currentBookings: events.currentBookings,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        whatToBring: events.whatToBring,
      })
      .from(events)
      .where(eq(events.id, parseInt(eventId)))

    if (eventResults.length === 0) {
      return { success: false, error: "Event not found" }
    }

    const event = eventResults[0]

    // Generate confirmation token
    const confirmationToken = randomUUID()

    // Create booking
    const bookingResults = await db
      .insert(bookings)
      .values({
        eventId: parseInt(eventId),
        clerkUserId: userId,
        participantName: name,
        participantEmail: email,
        phone: phone || null,
        notes: notes || null,
        confirmationToken,
      })
      .returning({ id: bookings.id, confirmationToken: bookings.confirmationToken })

    const bookingId = bookingResults[0].id
    const token = bookingResults[0].confirmationToken

    // Update event booking count
    await db
      .update(events)
      .set({ currentBookings: sql`${events.currentBookings} + 1` })
      .where(eq(events.id, parseInt(eventId)))

    try {
      await sendBookingConfirmationEmail({
        participantName: name,
        participantEmail: email,
        eventTitle: event.title,
        eventDate: event.date,
        eventStartTime: event.startTime,
        eventEndTime: event.endTime,
        eventLocation: event.location || "",
        instructorName: event.instructor,
        bookingId,
        confirmationToken: token,
        whatToBring: event.whatToBring,
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
      // Continue even if email fails
    }

    try {
      await sendAdminNotificationEmail({
        participantName: name,
        participantEmail: email,
        participantPhone: phone,
        eventTitle: event.title,
        eventDate: event.date,
        eventStartTime: event.startTime,
        bookingId,
      })
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError)
      // Continue even if email fails
    }

    // Revalidate relevant pages
    revalidatePath("/")
    revalidatePath(`/event/${createEventSlug(parseInt(eventId), event.title, event.instructor)}`)

    return { success: true, bookingId, confirmationToken: token }
  } catch (error) {
    console.error("Booking error:", error)
    return { success: false, error: "Failed to create booking" }
  }
}

export async function cancelBooking(bookingId: number) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to cancel a booking" }
  }

  try {
    // Find the booking and verify ownership
    const bookingResults = await db
      .select({
        id: bookings.id,
        eventId: bookings.eventId,
        clerkUserId: bookings.clerkUserId,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))

    if (bookingResults.length === 0) {
      return { success: false, error: "Booking not found" }
    }

    const booking = bookingResults[0]

    // Verify ownership via clerkUserId
    if (!booking.clerkUserId || booking.clerkUserId !== userId) {
      return { success: false, error: "Unauthorized. You can only cancel your own bookings." }
    }

    // Fetch event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, booking.eventId))

    // Delete the booking
    await db.delete(bookings).where(eq(bookings.id, bookingId))

    // Update event booking count
    await db
      .update(events)
      .set({ currentBookings: sql`${events.currentBookings} - 1` })
      .where(eq(events.id, booking.eventId))

    // Revalidate relevant pages
    revalidatePath("/")
    if (eventResults.length > 0) {
      revalidatePath(`/event/${createEventSlug(booking.eventId, eventResults[0].title, eventResults[0].instructor)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return { success: false, error: "Failed to cancel booking" }
  }
}

export async function cancelBookingByEvent(eventId: number) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to cancel a booking" }
  }

  try {
    // Find the user's booking for this event
    const bookingResults = await db
      .select({
        id: bookings.id,
        eventId: bookings.eventId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.eventId, eventId),
          eq(bookings.clerkUserId, userId)
        )
      )

    if (bookingResults.length === 0) {
      return { success: false, error: "Booking not found" }
    }

    const booking = bookingResults[0]

    // Fetch event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, eventId))

    // Delete the booking
    await db.delete(bookings).where(eq(bookings.id, booking.id))

    // Update event booking count
    await db
      .update(events)
      .set({ currentBookings: sql`${events.currentBookings} - 1` })
      .where(eq(events.id, eventId))

    // Revalidate relevant pages
    revalidatePath("/")
    if (eventResults.length > 0) {
      revalidatePath(`/event/${createEventSlug(eventId, eventResults[0].title, eventResults[0].instructor)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return { success: false, error: "Failed to cancel booking" }
  }
}

export async function addComment(eventId: number, content: string) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to comment" }
  }

  const user = await currentUser()
  if (!user) {
    return { success: false, error: "Unable to retrieve user information" }
  }

  // Try to get displayName and avatarImageUrl from database, fallback to Clerk firstName/username
  let authorName = getUserName(user)
  let authorImageUrl: string | null = null
  
  try {
    const { users } = await import("@/db/schema")
    const userRecord = await db
      .select({ 
        displayName: users.displayName,
        avatarImageUrl: users.avatarImageUrl,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)
    
    if (userRecord.length > 0) {
      if (userRecord[0].displayName) {
        authorName = userRecord[0].displayName
      }
      authorImageUrl = userRecord[0].avatarImageUrl || null
    }
  } catch (error) {
    // If database lookup fails, fall back to Clerk name
    console.error("Failed to fetch user profile:", error)
  }

  if (!content.trim()) {
    return { success: false, error: "Comment cannot be empty" }
  }

  try {
    // Check if event exists
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, eventId))

    if (eventResults.length === 0) {
      return { success: false, error: "Event not found" }
    }

    const event = eventResults[0]

    // Import comments here to avoid circular import issues
    const { comments } = await import("@/db/schema")

    // Create comment
    const commentResults = await db
      .insert(comments)
      .values({
        eventId,
        clerkUserId: userId,
        authorName,
        authorImageUrl,
        content: content.trim(),
      })
      .returning({ id: comments.id })

    // Revalidate event page
    revalidatePath(`/event/${createEventSlug(eventId, event.title, event.instructor)}`)

    return { success: true, commentId: commentResults[0].id }
  } catch (error) {
    console.error("Add comment error:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deleteComment(commentId: number) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to delete a comment" }
  }

  try {
    // Import comments here to avoid circular import issues
    const { comments } = await import("@/db/schema")

    // Find the comment and verify ownership
    const commentResults = await db
      .select({
        id: comments.id,
        eventId: comments.eventId,
        clerkUserId: comments.clerkUserId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))

    if (commentResults.length === 0) {
      return { success: false, error: "Comment not found" }
    }

    const comment = commentResults[0]

    // Verify ownership
    if (comment.clerkUserId !== userId) {
      return { success: false, error: "Unauthorized. You can only delete your own comments." }
    }

    // Get event details for revalidation
    const eventResults = await db
      .select({
        title: events.title,
        instructor: events.instructor,
      })
      .from(events)
      .where(eq(events.id, comment.eventId))

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, commentId))

    // Revalidate event page
    if (eventResults.length > 0) {
      revalidatePath(`/event/${createEventSlug(comment.eventId, eventResults[0].title, eventResults[0].instructor)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Delete comment error:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}
