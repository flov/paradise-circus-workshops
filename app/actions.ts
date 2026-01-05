"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email"

export async function createBooking(formData: FormData) {
  const sql = neon(process.env.DATABASE_URL!)

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
    // Check if workshop exists and has capacity
    const workshops = await sql`
      SELECT id, max_capacity, current_bookings, title, date, start_time, end_time, location, instructor
      FROM workshops 
      WHERE id = ${workshopId}
    `

    if (workshops.length === 0) {
      return { success: false, error: "Workshop not found" }
    }

    const workshop = workshops[0]
    if (workshop.current_bookings >= workshop.max_capacity) {
      return { success: false, error: "Workshop is full" }
    }

    // Create booking
    const bookings = await sql`
      INSERT INTO bookings (workshop_id, participant_name, participant_email, phone, notes)
      VALUES (${workshopId}, ${name}, ${email}, ${phone || null}, ${notes || null})
      RETURNING id
    `

    const bookingId = bookings[0].id

    // Update workshop capacity
    await sql`
      UPDATE workshops 
      SET current_bookings = current_bookings + 1
      WHERE id = ${workshopId}
    `

    try {
      await sendBookingConfirmationEmail({
        participantName: name,
        participantEmail: email,
        workshopTitle: workshop.title,
        workshopDate: workshop.date,
        workshopStartTime: workshop.start_time,
        workshopEndTime: workshop.end_time,
        workshopLocation: workshop.location,
        instructorName: workshop.instructor,
        bookingId,
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
        workshopStartTime: workshop.start_time,
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
