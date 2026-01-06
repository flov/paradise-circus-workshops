"use server"

import { db } from "@/db"
import { workshops, bookings } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email"

export async function createBooking(formData: FormData) {
  const workshopId = formData.get("workshopId") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  // Validate required fields
  if (!workshopId || !name || !email) {
    return { success: false, error: "Missing required fields" }
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

    // Create booking
    const bookingResults = await db
      .insert(bookings)
      .values({
        workshopId: parseInt(workshopId),
        participantName: name,
        participantEmail: email,
        phone: phone || null,
        notes: notes || null,
      })
      .returning({ id: bookings.id })

    const bookingId = bookingResults[0].id

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
    revalidatePath(`/book/${workshopId}`)

    return { success: true, bookingId }
  } catch (error) {
    console.error("Booking error:", error)
    return { success: false, error: "Failed to create booking" }
  }
}
