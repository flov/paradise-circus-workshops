"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

export async function createWorkshop(formData: FormData) {
  const sql = neon(process.env.DATABASE_URL!)

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const max_capacity = formData.get("max_capacity") as string

  if (!title || !description || !instructor || !date || !start_time || !end_time || !location || !max_capacity) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    await sql`
      INSERT INTO workshops (title, description, instructor, date, start_time, end_time, location, max_capacity)
      VALUES (${title}, ${description}, ${instructor}, ${date}, ${start_time}, ${end_time}, ${location}, ${max_capacity})
    `

    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error creating workshop:", error)
    return { success: false, error: "Failed to create workshop" }
  }
}

export async function updateWorkshop(formData: FormData) {
  const sql = neon(process.env.DATABASE_URL!)

  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const instructor = formData.get("instructor") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const max_capacity = formData.get("max_capacity") as string

  if (!id || !title || !description || !instructor || !date || !start_time || !end_time || !location || !max_capacity) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    await sql`
      UPDATE workshops 
      SET title = ${title}, description = ${description}, instructor = ${instructor}, 
          date = ${date}, start_time = ${start_time}, end_time = ${end_time}, 
          location = ${location}, max_capacity = ${max_capacity}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/book/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating workshop:", error)
    return { success: false, error: "Failed to update workshop" }
  }
}

export async function deleteWorkshop(workshopId: number) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    await sql`DELETE FROM workshops WHERE id = ${workshopId}`

    revalidatePath("/admin")
    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting workshop:", error)
    throw error
  }
}

export async function deleteBooking(bookingId: number, workshopId: number) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    await sql`DELETE FROM bookings WHERE id = ${bookingId}`

    // Update workshop capacity
    await sql`
      UPDATE workshops 
      SET current_bookings = current_bookings - 1
      WHERE id = ${workshopId}
    `

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/book/${workshopId}`)
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw error
  }
}
