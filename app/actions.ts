"use server"

import { randomUUID } from "crypto"
import { db } from "@/db"
import { workshops, bookings } from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserName, getUserEmail, createWorkshopSlug } from "@/lib/utils"

export async function createBooking(formData: FormData) {
  // Get authenticated user
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to book a workshop" }
  }

  const user = await currentUser()
  if (!user) {
    return { success: false, error: "Unable to retrieve user information" }
  }

  // Get user's name and email from Clerk, fallback to form data
  const clerkName = getUserName(user)
  const clerkEmail = getUserEmail(user)

  const workshopId = formData.get("workshopId") as string
  const formName = formData.get("name") as string
  const formEmail = formData.get("email") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  // Use Clerk data if available, otherwise fallback to form data
  const name = clerkName || formName
  const email = clerkEmail || formEmail

  // Validate required fields
  if (!workshopId || !name || !email) {
    return { success: false, error: "Missing required fields. Please ensure you have a name and email." }
  }

  try {
    // Check if workshop exists
    const workshopResults = await db
      .select({
        id: workshops.id,
        currentBookings: workshops.currentBookings,
        title: workshops.title,
        date: workshops.date,
        startTime: workshops.startTime,
        endTime: workshops.endTime,
        location: workshops.location,
        instructor: workshops.instructor,
        whatToBring: workshops.whatToBring,
      })
      .from(workshops)
      .where(eq(workshops.id, parseInt(workshopId)))

    if (workshopResults.length === 0) {
      return { success: false, error: "Workshop not found" }
    }

    const workshop = workshopResults[0]

    // Generate confirmation token
    const confirmationToken = randomUUID()

    // Create booking
    const bookingResults = await db
      .insert(bookings)
      .values({
        workshopId: parseInt(workshopId),
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

    // Update workshop booking count
    await db
      .update(workshops)
      .set({ currentBookings: sql`${workshops.currentBookings} + 1` })
      .where(eq(workshops.id, parseInt(workshopId)))

    try {
      await sendBookingConfirmationEmail({
        participantName: name,
        participantEmail: email,
        workshopTitle: workshop.title,
        workshopDate: workshop.date,
        workshopStartTime: workshop.startTime,
        workshopEndTime: workshop.endTime,
        workshopLocation: workshop.location || "",
        instructorName: workshop.instructor,
        bookingId,
        confirmationToken: token,
        whatToBring: workshop.whatToBring,
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
        workshopTitle: workshop.title,
        workshopDate: workshop.date,
        workshopStartTime: workshop.startTime,
        bookingId,
      })
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError)
      // Continue even if email fails
    }

    // Revalidate relevant pages
    revalidatePath("/")
    revalidatePath(`/book/${createWorkshopSlug(parseInt(workshopId), workshop.title, workshop.instructor)}`)

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
        workshopId: bookings.workshopId,
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

    // Fetch workshop details for revalidation
    const workshopResults = await db
      .select({
        title: workshops.title,
        instructor: workshops.instructor,
      })
      .from(workshops)
      .where(eq(workshops.id, booking.workshopId))

    // Delete the booking
    await db.delete(bookings).where(eq(bookings.id, bookingId))

    // Update workshop booking count
    await db
      .update(workshops)
      .set({ currentBookings: sql`${workshops.currentBookings} - 1` })
      .where(eq(workshops.id, booking.workshopId))

    // Revalidate relevant pages
    revalidatePath("/")
    if (workshopResults.length > 0) {
      revalidatePath(`/book/${createWorkshopSlug(booking.workshopId, workshopResults[0].title, workshopResults[0].instructor)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return { success: false, error: "Failed to cancel booking" }
  }
}

export async function cancelBookingByWorkshop(workshopId: number) {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "You must be signed in to cancel a booking" }
  }

  try {
    // Find the user's booking for this workshop
    const bookingResults = await db
      .select({
        id: bookings.id,
        workshopId: bookings.workshopId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.workshopId, workshopId),
          eq(bookings.clerkUserId, userId)
        )
      )

    if (bookingResults.length === 0) {
      return { success: false, error: "Booking not found" }
    }

    const booking = bookingResults[0]

    // Fetch workshop details for revalidation
    const workshopResults = await db
      .select({
        title: workshops.title,
        instructor: workshops.instructor,
      })
      .from(workshops)
      .where(eq(workshops.id, workshopId))

    // Delete the booking
    await db.delete(bookings).where(eq(bookings.id, booking.id))

    // Update workshop booking count
    await db
      .update(workshops)
      .set({ currentBookings: sql`${workshops.currentBookings} - 1` })
      .where(eq(workshops.id, workshopId))

    // Revalidate relevant pages
    revalidatePath("/")
    if (workshopResults.length > 0) {
      revalidatePath(`/book/${createWorkshopSlug(workshopId, workshopResults[0].title, workshopResults[0].instructor)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Cancel booking error:", error)
    return { success: false, error: "Failed to cancel booking" }
  }
}
