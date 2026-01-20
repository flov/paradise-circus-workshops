"use server"

import { db } from "@/db"
import { events, bookings, props, users } from "@/db/schema"
import { eq, sql, inArray, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createEventSlug } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { isAdmin, isInstructor, getAllAdmins } from "@/app/profile/actions"
import { sendEventPendingApprovalEmail, sendAdminEventPendingEmail, sendEventApprovedEmail, sendEventCancelledEmail, sendInstructorAssignedEmail } from "@/lib/email"
import { randomUUID } from "crypto"

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
  const instructorIdInput = formData.get("instructorId") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const whatToBring = formData.get("whatToBring") as string
  const propIdInput = formData.get("propId") as string
  const isWorkshop = formData.get("isWorkshop") === "on" || formData.get("isWorkshop") === "true"
  const isRecurringInput = formData.get("isRecurring") as string
  const isRecurring = isRecurringInput === "on" || isRecurringInput === "true"
  const recurUntil = formData.get("recurUntil") as string
  
  // Validate required fields
  if (!title || !description || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  // Validate recurring fields - only admins can create recurring events
  if (isRecurring && !userIsAdmin) {
    return { success: false, error: "Unauthorized. Only admins can create recurring events." }
  }

  // Validate recurUntil if recurring is enabled
  if (isRecurring) {
    if (!recurUntil) {
      return { success: false, error: "Recur Until date is required for recurring events." }
    }
    const startDate = new Date(date)
    const endDate = new Date(recurUntil)
    if (endDate < startDate) {
      return { success: false, error: "Recur Until date must be after the start date." }
    }
    // Limit recurring period to 1 year to prevent abuse
    const maxDate = new Date(startDate)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (endDate > maxDate) {
      return { success: false, error: "Recurring period cannot exceed 1 year." }
    }
  }

  // Validate that either instructorId or instructor string is provided
  if (!instructorIdInput && !instructor) {
    return { success: false, error: "Either instructorId or instructor name must be provided" }
  }

  try {
    // Parse propId if provided
    const propId = propIdInput ? parseInt(propIdInput, 10) : null
    
    let instructorId: number | null = null
    let instructorName: string | null = null

    // If instructorId is provided, fetch user info and use it
    if (instructorIdInput) {
      instructorId = parseInt(instructorIdInput, 10)
      if (isNaN(instructorId)) {
        return { success: false, error: "Invalid instructorId" }
      }

      // Fetch user's displayName || username to populate instructor string
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1)

      if (userResult.length === 0) {
        return { success: false, error: "Instructor user not found" }
      }

      instructorName = userResult[0].displayName || userResult[0].username
    } else {
      // Only instructor string provided (admin-only case)
      instructorName = instructor
      instructorId = null
    }

    // If user is instructor (not admin), ensure instructorId matches their user id
    if (!userIsAdmin && userIsInstructor) {
      const currentUserResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1)

      if (currentUserResult.length === 0) {
        return { success: false, error: "User record not found" }
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserResult[0].id
      
      // Fetch user's displayName || username
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1)

      if (userResult.length > 0) {
        instructorName = userResult[0].displayName || userResult[0].username
      }
    }

    // Determine isPublished: true for admins, false for instructors
    const isPublished = userIsAdmin

    // Handle recurring events
    if (isRecurring && recurUntil) {
      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID()
      
      // Calculate all dates (weekly from start date until recurUntil)
      const startDate = new Date(date)
      const endDate = new Date(recurUntil)
      const eventDates: string[] = []
      
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        eventDates.push(currentDate.toISOString().split("T")[0])
        currentDate = new Date(currentDate)
        currentDate.setDate(currentDate.getDate() + 7)
      }

      if (eventDates.length === 0) {
        return { success: false, error: "No valid dates found for recurring event." }
      }

      // Create all events in a transaction
      const eventValues = eventDates.map((eventDate) => ({
        title,
        description,
        instructor: instructorName,
        instructorId: instructorId,
        date: eventDate,
        startTime: start_time,
        endTime: end_time,
        location,
        whatToBring: whatToBring || null,
        isWorkshop,
        isPublished,
        propId: propId || null,
        recurringSeriesId,
        isRecurring: true,
      }))

      const newEvents = await db.insert(events).values(eventValues).returning({ id: events.id })

      // Send instructor assignment email if admin assigned an instructorId (for recurring events, send for first event)
      if (userIsAdmin && instructorId && newEvents.length > 0) {
        try {
          // Fetch instructor details for email
          const instructorResult = await db
            .select({ 
              email: users.email, 
              displayName: users.displayName, 
              username: users.username 
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1)

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email
            const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

            if (!instructorEmail) {
              console.error(`Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`)
            } else {
              try {
                const eventSlug = createEventSlug(newEvents[0].id, title, instructorName)
                await sendInstructorAssignedEmail({
                  instructorName: instructorDisplayName,
                  instructorEmail,
                  eventTitle: title,
                  eventDate: date,
                  eventStartTime: start_time,
                  eventEndTime: end_time,
                  eventLocation: location,
                  eventSlug,
                })
                console.log(`Instructor assignment email sent to: ${instructorEmail}`)
              } catch (emailError) {
                console.error(`Failed to send instructor assignment email to ${instructorEmail}:`, emailError)
              }
            }
          } else {
            console.error(`Instructor with id ${instructorId} not found. Cannot send assignment email.`)
          }
        } catch (error) {
          console.error("Error sending instructor assignment email:", error)
          // Don't fail the event creation if email fails
        }
      }

      // Send emails only for the first event if instructor created (not published)
      if (!isPublished && instructorId && newEvents.length > 0) {
        try {
          // Fetch instructor details for email
          const instructorResult = await db
            .select({ 
              email: users.email, 
              displayName: users.displayName, 
              username: users.username 
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1)

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email
            const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

            if (!instructorEmail) {
              console.error(`Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send pending approval email.`)
            } else {
              // Send email to instructor about pending approval (mentioning recurring)
              try {
                await sendEventPendingApprovalEmail({
                  instructorName: instructorDisplayName,
                  instructorEmail,
                  eventTitle: `${title} (Recurring - ${eventDates.length} events)`,
                  eventDate: date,
                  eventStartTime: start_time,
                  eventEndTime: end_time,
                  eventLocation: location,
                })
                console.log(`Pending approval email sent to instructor: ${instructorEmail}`)
              } catch (emailError) {
                console.error(`Failed to send pending approval email to instructor ${instructorEmail}:`, emailError)
              }

              // Send email to all admins about pending recurring events
              try {
                const adminUsers = await getAllAdmins()
                for (const admin of adminUsers) {
                  if (admin.email) {
                    await sendAdminEventPendingEmail({
                      instructorName: instructorDisplayName,
                      instructorEmail,
                      eventTitle: `${title} (Recurring - ${eventDates.length} events)`,
                      eventDate: date,
                      eventStartTime: start_time,
                      eventEndTime: end_time,
                      eventLocation: location,
                      eventId: newEvents[0].id,
                    }, admin.email).catch((error) => {
                      console.error(`Failed to send admin notification to ${admin.email}:`, error)
                    })
                  }
                }
              } catch (adminEmailError) {
                console.error("Error sending admin notifications:", adminEmailError)
              }
            }
          } else {
            console.error(`Instructor with id ${instructorId} not found. Cannot send pending approval email.`)
          }
        } catch (error) {
          console.error("Error sending event creation emails:", error)
          // Don't fail the event creation if emails fail
        }
      }

      revalidatePath("/admin")
      revalidatePath("/")

      return { success: true }
    }

    // Insert single event (non-recurring)
    const [newEvent] = await db.insert(events).values({
      title,
      description,
      instructor: instructorName,
      instructorId: instructorId,
      date,
      startTime: start_time,
      endTime: end_time,
      location,
      whatToBring: whatToBring || null,
      isWorkshop,
      isPublished,
      propId: propId || null,
      isRecurring: false,
    }).returning({ id: events.id })

    // Send instructor assignment email if admin assigned an instructorId
    if (userIsAdmin && instructorId) {
      try {
        // Fetch instructor details for email
        const instructorResult = await db
          .select({ 
            email: users.email, 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, instructorId))
          .limit(1)

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email
          const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

          if (!instructorEmail) {
            console.error(`Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`)
          } else {
            try {
              const eventSlug = createEventSlug(newEvent.id, title, instructorName)
              await sendInstructorAssignedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: title,
                eventDate: date,
                eventStartTime: start_time,
                eventEndTime: end_time,
                eventLocation: location,
                eventSlug,
              })
              console.log(`Instructor assignment email sent to: ${instructorEmail}`)
            } catch (emailError) {
              console.error(`Failed to send instructor assignment email to ${instructorEmail}:`, emailError)
            }
          }
        } else {
          console.error(`Instructor with id ${instructorId} not found. Cannot send assignment email.`)
        }
      } catch (error) {
        console.error("Error sending instructor assignment email:", error)
        // Don't fail the event creation if email fails
      }
    }

    // If instructor created event (not published), send emails
    if (!isPublished && instructorId) {
      try {
        // Fetch instructor details for email
        const instructorResult = await db
          .select({ 
            email: users.email, 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, instructorId))
          .limit(1)

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email
          const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

          if (!instructorEmail) {
            console.error(`Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send pending approval email.`)
          } else {
            // Send email to instructor about pending approval
            try {
              await sendEventPendingApprovalEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: title,
                eventDate: date,
                eventStartTime: start_time,
                eventEndTime: end_time,
                eventLocation: location,
              })
              console.log(`Pending approval email sent to instructor: ${instructorEmail}`)
            } catch (emailError) {
              console.error(`Failed to send pending approval email to instructor ${instructorEmail}:`, emailError)
            }

            // Send email to all admins about pending event
            try {
              const adminUsers = await getAllAdmins()
              for (const admin of adminUsers) {
                if (admin.email) {
                  await sendAdminEventPendingEmail({
                    instructorName: instructorDisplayName,
                    instructorEmail,
                    eventTitle: title,
                    eventDate: date,
                    eventStartTime: start_time,
                    eventEndTime: end_time,
                    eventLocation: location,
                    eventId: newEvent.id,
                  }, admin.email).catch((error) => {
                    console.error(`Failed to send admin notification to ${admin.email}:`, error)
                  })
                }
              }
            } catch (adminEmailError) {
              console.error("Error sending admin notifications:", adminEmailError)
            }
          }
        } else {
          console.error(`Instructor with id ${instructorId} not found. Cannot send pending approval email.`)
        }
      } catch (error) {
        console.error("Error sending event creation emails:", error)
        // Don't fail the event creation if emails fail
      }
    } else {
    }

    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error creating event:", error)
    return { success: false, error: "Failed to create event" }
  }
}

export async function approveEvent(eventId: number) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, error: "Unauthorized. You must be signed in to approve events." }
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin()
  
  if (!userIsAdmin) {
    return { success: false, error: "Unauthorized. Only admins can approve events." }
  }

  try {
    // Fetch event details
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        isPublished: events.isPublished,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found." }
    }

    const event = eventResult[0]

    // If already published, no need to do anything
    if (event.isPublished) {
      return { success: true, message: "Event is already published." }
    }

    // Update event to published
    await db
      .update(events)
      .set({ isPublished: true, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(events.id, eventId))

    // Send approval email to instructor
    if (event.instructorId) {
      try {
        const instructorResult = await db
          .select({ 
            email: users.email, 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, event.instructorId))
          .limit(1)

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email
          const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

          if (!instructorEmail) {
            console.error(`Instructor ${event.instructorId} (${instructorDisplayName}) does not have an email address. Cannot send approval email.`)
          } else {
            try {
              await sendEventApprovedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: event.title,
                eventDate: event.date,
                eventStartTime: event.startTime,
                eventEndTime: event.endTime,
                eventLocation: event.location || "",
                eventId: event.id,
              })
              console.log(`Approval email sent to instructor: ${instructorEmail}`)
            } catch (emailError) {
              console.error(`Failed to send approval email to instructor ${instructorEmail}:`, emailError)
            }
          }
        } else {
          console.error(`Instructor with id ${event.instructorId} not found. Cannot send approval email.`)
        }
      } catch (error) {
        console.error("Error sending approval email:", error)
        // Don't fail the approval if email fails
      }
    } else {
      console.log(`Skipping approval email: event ${eventId} has no instructorId`)
    }

    revalidatePath("/admin")
    revalidatePath("/admin/pending-approval")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error approving event:", error)
    return { success: false, error: "Failed to approve event" }
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
  const instructorIdInput = formData.get("instructorId") as string
  const date = formData.get("date") as string
  const start_time = formData.get("start_time") as string
  const end_time = formData.get("end_time") as string
  const location = formData.get("location") as string
  const whatToBring = formData.get("whatToBring") as string
  const propIdInput = formData.get("propId") as string
  const isWorkshop = formData.get("isWorkshop") === "on" || formData.get("isWorkshop") === "true"
  const isPublishedInput = formData.get("isPublished") as string
  const isPublished = isPublishedInput === "on" || isPublishedInput === "true"
  const isRecurringInput = formData.get("isRecurring") as string
  const isRecurring = isRecurringInput === "on" || isRecurringInput === "true"
  const recurUntil = formData.get("recurUntil") as string
  
  if (!id || !title || !description || !date || !start_time || !end_time || !location) {
    return { success: false, error: "Missing required fields" }
  }

  // Validate that either instructorId or instructor string is provided
  if (!instructorIdInput && !instructor) {
    return { success: false, error: "Either instructorId or instructor name must be provided" }
  }

  const eventId = parseInt(id)

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin()
  const userIsInstructor = await isInstructor()
  
  // Validate recurring fields - only admins can create/update recurring events
  if (isRecurring && !userIsAdmin) {
    return { success: false, error: "Unauthorized. Only admins can create recurring events." }
  }

  // Validate recurUntil if recurring is enabled
  if (isRecurring) {
    if (!recurUntil) {
      return { success: false, error: "Recur Until date is required for recurring events." }
    }
    const startDate = new Date(date)
    const endDate = new Date(recurUntil)
    if (endDate < startDate) {
      return { success: false, error: "Recur Until date must be after the start date." }
    }
    // Limit recurring period to 1 year to prevent abuse
    const maxDate = new Date(startDate)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (endDate > maxDate) {
      return { success: false, error: "Recurring period cannot exceed 1 year." }
    }
  }
  
  // Fetch current event state to check if isPublished is changing and if it's recurring
  const currentEventResult = await db
    .select({
      isPublished: events.isPublished,
      instructorId: events.instructorId,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      location: events.location,
      recurringSeriesId: events.recurringSeriesId,
      isRecurring: events.isRecurring,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (currentEventResult.length === 0) {
    return { success: false, error: "Event not found." }
  }

  const currentEvent = currentEventResult[0]
  const wasPublished = currentEvent.isPublished
  const isBeingPublished = isPublished && !wasPublished && userIsAdmin
  const isRecurringEvent = currentEvent.recurringSeriesId !== null && currentEvent.isRecurring

  // Only admins can update recurring events (to update all instances)
  if (isRecurringEvent && !userIsAdmin) {
    return { success: false, error: "Unauthorized. Only admins can update recurring events." }
  }
  
  if (!userIsAdmin) {
    // Check if user is instructor
    const userResult = await db
      .select({ id: users.id, username: users.username, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      return { success: false, error: "Unauthorized. Only admins and event instructors can update events." }
    }

    const currentUserId = userResult[0].id

    // Fetch event to check instructor
    const eventResult = await db
      .select({ instructor: events.instructor, instructorId: events.instructorId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found." }
    }

    // Check authorization: if instructorId exists, check that; otherwise check instructor string
    const eventInstructorId = eventResult[0].instructorId
    if (eventInstructorId !== null) {
      // Match instructorId
      if (eventInstructorId !== currentUserId) {
        return { success: false, error: "Unauthorized. You can only update events you are instructing." }
      }
    } else {
      // Fallback to instructor string comparison
      if (eventResult[0].instructor !== userResult[0].username) {
        return { success: false, error: "Unauthorized. You can only update events you are instructing." }
      }
    }
  }

  try {
    // Parse propId if provided
    const propId = propIdInput ? parseInt(propIdInput, 10) : null
    
    let instructorId: number | null = null
    let instructorName: string | null = null

    // If instructorId is provided, fetch user info and use it
    if (instructorIdInput) {
      instructorId = parseInt(instructorIdInput, 10)
      if (isNaN(instructorId)) {
        return { success: false, error: "Invalid instructorId" }
      }

      // Fetch user's displayName || username to populate instructor string
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1)

      if (userResult.length === 0) {
        return { success: false, error: "Instructor user not found" }
      }

      instructorName = userResult[0].displayName || userResult[0].username
    } else {
      // Only instructor string provided (admin-only case)
      instructorName = instructor
      instructorId = null
    }

    // If user is instructor (not admin), ensure instructorId matches their user id
    if (!userIsAdmin && userIsInstructor) {
      const currentUserResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1)

      if (currentUserResult.length === 0) {
        return { success: false, error: "User record not found" }
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserResult[0].id
      
      // Fetch user's displayName || username
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1)

      if (userResult.length > 0) {
        instructorName = userResult[0].displayName || userResult[0].username
      }
    }

    // Only allow admins to change isPublished
    const updateData: {
      title: string
      description: string
      instructor: string | null
      instructorId: number | null
      date: string
      startTime: string
      endTime: string
      location: string
      whatToBring: string | null
      isWorkshop: boolean
      propId: number | null
      updatedAt: ReturnType<typeof sql>
      isPublished?: boolean
    } = {
      title,
      description,
      instructor: instructorName,
      instructorId: instructorId,
      date,
      startTime: start_time,
      endTime: end_time,
      location,
      whatToBring: whatToBring || null,
      isWorkshop,
      propId: propId || null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }

    // Only update isPublished if user is admin
    if (userIsAdmin) {
      updateData.isPublished = isPublished
    }

    // Handle converting non-recurring event to recurring
    if (!isRecurringEvent && isRecurring && userIsAdmin && recurUntil) {
      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID()
      
      // Calculate all dates (weekly from start date until recurUntil)
      const startDate = new Date(date)
      const endDate = new Date(recurUntil)
      const eventDates: string[] = []
      
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        eventDates.push(currentDate.toISOString().split("T")[0])
        currentDate = new Date(currentDate)
        currentDate.setDate(currentDate.getDate() + 7)
      }

      if (eventDates.length === 0) {
        return { success: false, error: "No valid dates found for recurring event." }
      }

      // Update the current event to be part of the recurring series
      await db
        .update(events)
        .set({
          ...updateData,
          recurringSeriesId,
          isRecurring: true,
        })
        .where(eq(events.id, eventId))

      // Create additional events for remaining dates (skip the first date as it's the current event)
      if (eventDates.length > 1) {
        const additionalEventValues = eventDates.slice(1).map((eventDate) => ({
          title,
          description,
          instructor: instructorName,
          instructorId: instructorId,
          date: eventDate,
          startTime: start_time,
          endTime: end_time,
          location,
          whatToBring: whatToBring || null,
          isWorkshop,
          isPublished,
          propId: propId || null,
          recurringSeriesId,
          isRecurring: true,
        }))

        await db.insert(events).values(additionalEventValues)
      }

      revalidatePath("/admin")
      revalidatePath("/")

      return { success: true }
    }

    // Handle recurring events - update all events in the series
    if (isRecurringEvent && userIsAdmin && currentEvent.recurringSeriesId) {
      // Check if start date changed - if so, we need to recalculate dates
      const startDateChanged = currentEvent.date !== date
      
      if (startDateChanged) {
        // For recurring events, we need to find all events in the series and update their dates
        // Get all events in the series ordered by date
        const seriesEvents = await db
          .select({
            id: events.id,
            date: events.date,
          })
          .from(events)
          .where(eq(events.recurringSeriesId, currentEvent.recurringSeriesId))
          .orderBy(asc(events.date))

        if (seriesEvents.length > 0) {
          const originalStartDate = new Date(currentEvent.date)
          const newStartDate = new Date(date)
          const dateDiff = Math.round((newStartDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24))

          // Update all events in the series with new dates
          for (const seriesEvent of seriesEvents) {
            const originalDate = new Date(seriesEvent.date)
            const newDate = new Date(originalDate)
            newDate.setDate(newDate.getDate() + dateDiff)
            const newDateStr = newDate.toISOString().split("T")[0]

            await db
              .update(events)
              .set({
                ...updateData,
                date: newDateStr,
              })
              .where(eq(events.id, seriesEvent.id))
          }
        }
      } else {
        // Start date didn't change, just update all events in the series with the same data
        await db
          .update(events)
          .set(updateData)
          .where(eq(events.recurringSeriesId, currentEvent.recurringSeriesId))
      }
    } else {
      // Non-recurring event or non-admin updating - update single event
      await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, eventId))
    }

    // Send instructor assignment email if admin assigned/changed instructorId
    const oldInstructorId = currentEvent.instructorId
    const instructorIdChanged = oldInstructorId !== instructorId && instructorId !== null
    if (userIsAdmin && instructorIdChanged) {
      try {
        // Fetch instructor details for email
        const instructorResult = await db
          .select({ 
            email: users.email, 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, instructorId))
          .limit(1)

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email
          const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

          if (!instructorEmail) {
            console.error(`Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`)
          } else {
            try {
              const eventSlug = createEventSlug(eventId, title, instructorName)
              await sendInstructorAssignedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: title,
                eventDate: date,
                eventStartTime: start_time,
                eventEndTime: end_time,
                eventLocation: location,
                eventSlug,
              })
              console.log(`Instructor assignment email sent to: ${instructorEmail}`)
            } catch (emailError) {
              console.error(`Failed to send instructor assignment email to ${instructorEmail}:`, emailError)
            }
          }
        } else {
          console.error(`Instructor with id ${instructorId} not found. Cannot send assignment email.`)
        }
      } catch (error) {
        console.error("Error sending instructor assignment email:", error)
        // Don't fail the update if email fails
      }
    }

    // If admin is publishing an event that was unpublished, send approval email
    if (isBeingPublished && currentEvent.instructorId) {
      try {
        const instructorResult = await db
          .select({ 
            email: users.email, 
            displayName: users.displayName, 
            username: users.username 
          })
          .from(users)
          .where(eq(users.id, currentEvent.instructorId))
          .limit(1)

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email
          const instructorDisplayName = instructorResult[0].displayName || instructorResult[0].username

          if (!instructorEmail) {
            console.error(`Instructor ${currentEvent.instructorId} (${instructorDisplayName}) does not have an email address. Cannot send approval email.`)
          } else {
            try {
              await sendEventApprovedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: currentEvent.title,
                eventDate: currentEvent.date,
                eventStartTime: currentEvent.startTime,
                eventEndTime: currentEvent.endTime,
                eventLocation: currentEvent.location || "",
                eventId: eventId,
              })
              console.log(`Approval email sent to instructor: ${instructorEmail}`)
            } catch (emailError) {
              console.error(`Failed to send approval email to instructor ${instructorEmail}:`, emailError)
            }
          }
        } else {
          console.error(`Instructor with id ${currentEvent.instructorId} not found. Cannot send approval email.`)
        }
      } catch (error) {
        console.error("Error sending approval email:", error)
        // Don't fail the update if email fails
      }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    
    // Ensure title and instructorName are not null before creating slug
    if (title && instructorName) {
      revalidatePath(`/event/${createEventSlug(eventId, title, instructorName)}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating event:", error)
    return { success: false, error: "Failed to update event" }
  }
}

export async function deleteEvent(eventId: number, cancellationMessage?: string | null) {
  // Check authentication
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete events.")
  }

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin()
  
  if (!userIsAdmin) {
    // Check if user is instructor
    const userResult = await db
      .select({ id: users.id, username: users.username, isInstructor: users.isInstructor })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      throw new Error("Unauthorized. Only admins and event instructors can delete events.")
    }

    const currentUserId = userResult[0].id

    // Fetch event to check instructor
    const eventResult = await db
      .select({ instructor: events.instructor, instructorId: events.instructorId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResult.length === 0) {
      throw new Error("Event not found.")
    }

    // Check authorization: if instructorId exists, check that; otherwise check instructor string
    const eventInstructorId = eventResult[0].instructorId
    if (eventInstructorId !== null) {
      // Match instructorId
      if (eventInstructorId !== currentUserId) {
        throw new Error("Unauthorized. You can only delete events you are instructing.")
      }
    } else {
      // Fallback to instructor string comparison
      if (eventResult[0].instructor !== userResult[0].username) {
        throw new Error("Unauthorized. You can only delete events you are instructing.")
      }
    }
  }

  try {
    // Fetch event details with instructor info before deletion
    const eventResults = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        instructorId: events.instructorId,
        instructorProfile: {
          displayName: users.displayName,
          username: users.username,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(eq(events.id, eventId))
      .limit(1)

    if (eventResults.length === 0) {
      throw new Error("Event not found.")
    }

    const event = eventResults[0]
    
    // Get instructor name (prefer displayName, fallback to username, then instructor string)
    const instructorName = event.instructorProfile
      ? (event.instructorProfile.displayName || event.instructorProfile.username)
      : event.instructor || "Unknown Instructor"

    // Fetch all bookings for this event
    const eventBookings = await db
      .select({
        participantName: bookings.participantName,
        participantEmail: bookings.participantEmail,
      })
      .from(bookings)
      .where(eq(bookings.eventId, eventId))

    // Send cancellation emails to all participants
    if (eventBookings.length > 0) {
      const emailPromises = eventBookings.map((booking) =>
        sendEventCancelledEmail({
          participantName: booking.participantName,
          participantEmail: booking.participantEmail,
          eventTitle: event.title,
          eventDate: event.date,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
          eventLocation: event.location || "",
          instructorName: instructorName,
          cancellationMessage: cancellationMessage || null,
        }).catch((error) => {
          // Log error but don't fail the deletion if email fails
          console.error(`Failed to send cancellation email to ${booking.participantEmail}:`, error)
        })
      )

      // Wait for all emails to be sent (or fail gracefully)
      await Promise.allSettled(emailPromises)
    }

    // Delete the event (this will cascade delete bookings due to foreign key constraint)
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
    if (eventResults.length > 0 && eventResults[0].instructor) {
      revalidatePath(`/event/${createEventSlug(eventId, eventResults[0].title, eventResults[0].instructor)}`)
    }
  } catch (error) {
    console.error("Error deleting booking:", error)
    throw error
  }
}
