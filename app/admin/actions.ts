"use server";

import { db } from "@/db";
import { events, participations, props, users, userProps, comments } from "@/db/schema";
import { eq, sql, inArray, asc, desc, isNotNull, isNull, and, gte, lte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { createEventSlug, getUserEmail } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdmin, isInstructor, getAllAdmins } from "@/app/profile/actions";
import {
  sendEventPendingApprovalEmail,
  sendAdminEventPendingEmail,
  sendEventApprovedEmail,
  sendEventCancelledEmail,
  sendInstructorAssignedEmail,
  sendRecapAddedEmail,
  sendRecurringWorkshopInfoEmail,
  sendAdminPromotedEmail,
} from "@/lib/email";
import { randomUUID } from "crypto";

export async function createEvent(formData: FormData) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to create events.",
    };
  }

  // Check authorization: must be instructor OR admin
  const userIsAdmin = await isAdmin();
  const userIsInstructor = await isInstructor();

  if (!userIsAdmin && !userIsInstructor) {
    return {
      success: false,
      error: "Unauthorized. Only instructors and admins can create events.",
    };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const instructor = formData.get("instructor") as string;
  const instructorIdInput = formData.get("instructorId") as string;
  const date = formData.get("date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const location = formData.get("location") as string;
  const whatToBring = formData.get("whatToBring") as string;
  const propIdInput = formData.get("propId") as string;
  const isWorkshop =
    formData.get("isWorkshop") === "on" ||
    formData.get("isWorkshop") === "true";
  const isRecurringInput = formData.get("isRecurring") as string;
  const isRecurring = isRecurringInput === "on" || isRecurringInput === "true";
  const recurringUntilInput = formData.get("recurringUntil") as string | null;
  // For createEvent, if recurringUntil is provided, use it (empty string becomes null)
  const recurringUntil = recurringUntilInput || null;

  // Validate required fields
  if (
    !title ||
    !description ||
    !date ||
    !start_time ||
    !end_time ||
    !location
  ) {
    return { success: false, error: "Missing required fields" };
  }

  // Recurring events are allowed for both admins and instructors

  // Validate that either instructorId or instructor string is provided
  if (!instructorIdInput && !instructor) {
    return {
      success: false,
      error: "Either instructorId or instructor name must be provided",
    };
  }

  try {
    // Get current user's database ID for lastUpdatedBy
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    const currentUserId = currentUserResult.length > 0 ? currentUserResult[0].id : null;

    // Parse propId if provided
    const propId = propIdInput ? parseInt(propIdInput, 10) : null;

    let instructorId: number | null = null;
    let instructorName: string | null = null;

    // If instructorId is provided, fetch user info and use it
    if (instructorIdInput) {
      instructorId = parseInt(instructorIdInput, 10);
      if (isNaN(instructorId)) {
        return { success: false, error: "Invalid instructorId" };
      }

      // Fetch user's displayName || username to populate instructor string
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1);

      if (userResult.length === 0) {
        return { success: false, error: "Instructor user not found" };
      }

      instructorName = userResult[0].displayName || userResult[0].username;
    } else {
      // Only instructor string provided (admin-only case)
      instructorName = instructor;
      instructorId = null;
    }

    // If user is instructor (not admin), ensure instructorId matches their user id
    if (!userIsAdmin && userIsInstructor) {
      if (currentUserId === null) {
        return { success: false, error: "User record not found" };
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserId;

      // Fetch user's displayName || username
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1);

      if (userResult.length > 0) {
        instructorName = userResult[0].displayName || userResult[0].username;
      }
    }

    // Determine isPublished: true for admins, false for instructors
    const isPublished = userIsAdmin;

    // Validate recurringUntil for instructors
    if (isRecurring && !userIsAdmin && userIsInstructor) {
      if (!recurringUntil) {
        return {
          success: false,
          error: "Please specify an end date for recurring events.",
        };
      }
      // Validate that recurringUntil is after the start date
      const startDateObj = new Date(date);
      const endDateObj = new Date(recurringUntil);
      if (endDateObj < startDateObj) {
        return {
          success: false,
          error: "End date must be after the start date.",
        };
      }
    }

    // Handle recurring events
    if (isRecurring) {
      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID();

      const startDate = new Date(date);
      const eventDates: string[] = [];

      if (!userIsAdmin && userIsInstructor && recurringUntil) {
        // For instructors: create all events up to recurringUntil
        const endDate = new Date(recurringUntil);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          eventDates.push(currentDate.toISOString().split("T")[0]);
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else {
        // For admins: create only 1 week ahead (initial event + next week = 2 events total)
        // Events will be automatically extended weekly
        eventDates.push(startDate.toISOString().split("T")[0]);
        const nextWeekDate = new Date(startDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        eventDates.push(nextWeekDate.toISOString().split("T")[0]);
      }

      if (eventDates.length === 0) {
        return {
          success: false,
          error: "No valid dates found for recurring event.",
        };
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
        recurringUntil: recurringUntil || null,
        lastUpdatedBy: currentUserId,
        approvedBy: isPublished && currentUserId ? currentUserId : null,
      }));

      const newEvents = await db
        .insert(events)
        .values(eventValues)
        .returning({ id: events.id });

      // Send recurring workshop info email to instructor when they set up a recurring event
      if (instructorId && newEvents.length > 0) {
        try {
          // Fetch instructor details for email
          const instructorResult = await db
            .select({
              email: users.email,
              displayName: users.displayName,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1);

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email;
            const instructorDisplayName =
              instructorResult[0].displayName || instructorResult[0].username;

            if (instructorEmail) {
              try {
                await sendRecurringWorkshopInfoEmail({
                  instructorName: instructorDisplayName,
                  instructorEmail,
                });
              } catch (emailError) {
                console.error(
                  `Failed to send recurring workshop info email to ${instructorEmail}:`,
                  emailError,
                );
                // Don't fail the event creation if email fails
              }
            }
          }
        } catch (error) {
          console.error(
            "Error sending recurring workshop info email:",
            error,
          );
          // Don't fail the event creation if email fails
        }
      }

      // Send instructor assignment email if admin assigned an instructorId (for recurring events, send for first event)
      if (userIsAdmin && instructorId && newEvents.length > 0) {
        try {
          // Fetch instructor details for email
          const instructorResult = await db
            .select({
              email: users.email,
              displayName: users.displayName,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1);

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email;
            const instructorDisplayName =
              instructorResult[0].displayName || instructorResult[0].username;

            if (!instructorEmail) {
              console.error(
                `Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`,
              );
            } else {
              try {
                const eventSlug = createEventSlug(
                  newEvents[0].id,
                  title,
                  instructorName,
                );
                await sendInstructorAssignedEmail({
                  instructorName: instructorDisplayName,
                  instructorEmail,
                  eventTitle: title,
                  eventDate: date,
                  eventStartTime: start_time,
                  eventEndTime: end_time,
                  eventLocation: location,
                  eventSlug,
                });
              } catch (emailError) {
                console.error(
                  `Failed to send instructor assignment email to ${instructorEmail}:`,
                  emailError,
                );
              }
            }
          } else {
            console.error(
              `Instructor with id ${instructorId} not found. Cannot send assignment email.`,
            );
          }
        } catch (error) {
          console.error("Error sending instructor assignment email:", error);
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
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1);

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email;
            const instructorDisplayName =
              instructorResult[0].displayName || instructorResult[0].username;

            if (!instructorEmail) {
              console.error(
                `Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send pending approval email.`,
              );
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
                });
              } catch (emailError) {
                console.error(
                  `Failed to send pending approval email to instructor ${instructorEmail}:`,
                  emailError,
                );
              }

              // Send email to all admins about pending recurring events
              try {
                const adminUsers = await getAllAdmins();
                for (const admin of adminUsers) {
                  if (admin.email) {
                    await sendAdminEventPendingEmail(
                      {
                        instructorName: instructorDisplayName,
                        instructorEmail,
                        eventTitle: `${title} (Recurring - ${eventDates.length} events)`,
                        eventDate: date,
                        eventStartTime: start_time,
                        eventEndTime: end_time,
                        eventLocation: location,
                        eventId: newEvents[0].id,
                      },
                      admin.email,
                    ).catch((error) => {
                      console.error(
                        `Failed to send admin notification to ${admin.email}:`,
                        error,
                      );
                    });
                  }
                }
              } catch (adminEmailError) {
                console.error(
                  "Error sending admin notifications:",
                  adminEmailError,
                );
              }
            }
          } else {
            console.error(
              `Instructor with id ${instructorId} not found. Cannot send pending approval email.`,
            );
          }
        } catch (error) {
          console.error("Error sending event creation emails:", error);
          // Don't fail the event creation if emails fail
        }
      }

      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/api/timetable");
      revalidateTag("timetable-public");

      return { success: true };
    }

    // Insert single event (non-recurring)
    const [newEvent] = await db
      .insert(events)
      .values({
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
        lastUpdatedBy: currentUserId,
        approvedBy: isPublished && currentUserId ? currentUserId : null,
      })
      .returning({ id: events.id });

    // Send instructor assignment email if admin assigned an instructorId
    if (userIsAdmin && instructorId) {
      try {
        // Fetch instructor details for email
        const instructorResult = await db
          .select({
            email: users.email,
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, instructorId))
          .limit(1);

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email;
          const instructorDisplayName =
            instructorResult[0].displayName || instructorResult[0].username;

          if (!instructorEmail) {
            console.error(
              `Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`,
            );
          } else {
            try {
              const eventSlug = createEventSlug(
                newEvent.id,
                title,
                instructorName,
              );
              await sendInstructorAssignedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: title,
                eventDate: date,
                eventStartTime: start_time,
                eventEndTime: end_time,
                eventLocation: location,
                eventSlug,
              });
            } catch (emailError) {
              console.error(
                `Failed to send instructor assignment email to ${instructorEmail}:`,
                emailError,
              );
            }
          }
        } else {
          console.error(
            `Instructor with id ${instructorId} not found. Cannot send assignment email.`,
          );
        }
      } catch (error) {
        console.error("Error sending instructor assignment email:", error);
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
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, instructorId))
          .limit(1);

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email;
          const instructorDisplayName =
            instructorResult[0].displayName || instructorResult[0].username;

          if (!instructorEmail) {
            console.error(
              `Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send pending approval email.`,
            );
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
              });
            } catch (emailError) {
              console.error(
                `Failed to send pending approval email to instructor ${instructorEmail}:`,
                emailError,
              );
            }

            // Send email to all admins about pending event
            try {
              const adminUsers = await getAllAdmins();
              for (const admin of adminUsers) {
                if (admin.email) {
                  await sendAdminEventPendingEmail(
                    {
                      instructorName: instructorDisplayName,
                      instructorEmail,
                      eventTitle: title,
                      eventDate: date,
                      eventStartTime: start_time,
                      eventEndTime: end_time,
                      eventLocation: location,
                      eventId: newEvent.id,
                    },
                    admin.email,
                  ).catch((error) => {
                    console.error(
                      `Failed to send admin notification to ${admin.email}:`,
                      error,
                    );
                  });
                }
              }
            } catch (adminEmailError) {
              console.error(
                "Error sending admin notifications:",
                adminEmailError,
              );
            }
          }
        } else {
          console.error(
            `Instructor with id ${instructorId} not found. Cannot send pending approval email.`,
          );
        }
      } catch (error) {
        console.error("Error sending event creation emails:", error);
        // Don't fail the event creation if emails fail
      }
    } else {
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");

    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function approveEvent(eventId: number) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to approve events.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can approve events.",
    };
  }

  try {
    // Get current user's database ID for approvedBy
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    const currentUserId = currentUserResult.length > 0 ? currentUserResult[0].id : null;

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
      .limit(1);

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found." };
    }

    const event = eventResult[0];

    // If already published, no need to do anything
    if (event.isPublished) {
      return { success: true, message: "Event is already published." };
    }

    // Update event to published and set approvedBy
    await db
      .update(events)
      .set({ 
        isPublished: true, 
        updatedAt: sql`CURRENT_TIMESTAMP`,
        approvedBy: currentUserId,
      })
      .where(eq(events.id, eventId));

    // Send approval email to instructor
    if (event.instructorId) {
      try {
        const instructorResult = await db
          .select({
            email: users.email,
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, event.instructorId))
          .limit(1);

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email;
          const instructorDisplayName =
            instructorResult[0].displayName || instructorResult[0].username;

          if (!instructorEmail) {
            console.error(
              `Instructor ${event.instructorId} (${instructorDisplayName}) does not have an email address. Cannot send approval email.`,
            );
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
              });
            } catch (emailError) {
              console.error(
                `Failed to send approval email to instructor ${instructorEmail}:`,
                emailError,
              );
            }
          }
        } else {
          console.error(
            `Instructor with id ${event.instructorId} not found. Cannot send approval email.`,
          );
        }
      } catch (error) {
        console.error("Error sending approval email:", error);
        // Don't fail the approval if email fails
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pending-approval");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error approving event:", error);
    return { success: false, error: "Failed to approve event" };
  }
}

export async function updateEvent(formData: FormData) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to update events.",
    };
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const instructor = formData.get("instructor") as string;
  const instructorIdInput = formData.get("instructorId") as string;
  const date = formData.get("date") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const location = formData.get("location") as string;
  const whatToBring = formData.get("whatToBring") as string;
  const propIdInput = formData.get("propId") as string;
  const isWorkshop =
    formData.get("isWorkshop") === "on" ||
    formData.get("isWorkshop") === "true";
  const isPublishedInput = formData.get("isPublished") as string;
  const isPublished = isPublishedInput === "on" || isPublishedInput === "true";
  const isRecurringInput = formData.get("isRecurring") as string;
  const isRecurring = isRecurringInput === "on" || isRecurringInput === "true";
  const recurringUntilInput = formData.get("recurringUntil") as string | null;
  // If recurringUntil is in formData, use it (even if empty string - will become null)
  // If not in formData, it means the event is not recurring, so don't update the field
  const recurringUntil = recurringUntilInput !== null 
    ? (recurringUntilInput || null) 
    : undefined;

  if (
    !id ||
    !title ||
    !description ||
    !date ||
    !start_time ||
    !end_time ||
    !location
  ) {
    return { success: false, error: "Missing required fields" };
  }

  // Validate that either instructorId or instructor string is provided
  if (!instructorIdInput && !instructor) {
    return {
      success: false,
      error: "Either instructorId or instructor name must be provided",
    };
  }

  const eventId = parseInt(id);

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin();
  const userIsInstructor = await isInstructor();

  // Recurring events are allowed for both admins and instructors

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
    .limit(1);

  if (currentEventResult.length === 0) {
    return { success: false, error: "Event not found." };
  }

    const currentEvent = currentEventResult[0];
    const wasPublished = currentEvent.isPublished;
    const isRecurringEvent =
      currentEvent.recurringSeriesId !== null && currentEvent.isRecurring;

  // Instructors can update their own recurring events, but only single instances
  // Admins can update all instances in a recurring series
  if (isRecurringEvent && !userIsAdmin) {
    // For instructors, we'll allow updating single events in a recurring series
    // but not converting between recurring/non-recurring or updating all instances
  }

  if (!userIsAdmin) {
    // Check if user is instructor
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        isInstructor: users.isInstructor,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      return {
        success: false,
        error:
          "Unauthorized. Only admins and event instructors can update events.",
      };
    }

    const currentUserId = userResult[0].id;

    // Fetch event to check instructor
    const eventResult = await db
      .select({
        instructor: events.instructor,
        instructorId: events.instructorId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found." };
    }

    // Check authorization: if instructorId exists, check that; otherwise check instructor string
    const eventInstructorId = eventResult[0].instructorId;
    if (eventInstructorId !== null) {
      // Match instructorId
      if (eventInstructorId !== currentUserId) {
        return {
          success: false,
          error:
            "Unauthorized. You can only update events you are instructing.",
        };
      }
    } else {
      // Fallback to instructor string comparison
      if (eventResult[0].instructor !== userResult[0].username) {
        return {
          success: false,
          error:
            "Unauthorized. You can only update events you are instructing.",
        };
      }
    }
  }

  try {
    // Get current user's database ID for lastUpdatedBy
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    const currentUserId = currentUserResult.length > 0 ? currentUserResult[0].id : null;

    // Parse propId if provided
    const propId = propIdInput ? parseInt(propIdInput, 10) : null;

    let instructorId: number | null = null;
    let instructorName: string | null = null;

    // If instructorId is provided, fetch user info and use it
    if (instructorIdInput) {
      instructorId = parseInt(instructorIdInput, 10);
      if (isNaN(instructorId)) {
        return { success: false, error: "Invalid instructorId" };
      }

      // Fetch user's displayName || username to populate instructor string
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1);

      if (userResult.length === 0) {
        return { success: false, error: "Instructor user not found" };
      }

      instructorName = userResult[0].displayName || userResult[0].username;
    } else {
      // Only instructor string provided (admin-only case)
      instructorName = instructor;
      instructorId = null;
    }

    // If user is instructor (not admin), ensure instructorId matches their user id
    if (!userIsAdmin && userIsInstructor) {
      if (currentUserId === null) {
        return { success: false, error: "User record not found" };
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserId;

      // Fetch user's displayName || username
      const userResult = await db
        .select({ displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1);

      if (userResult.length > 0) {
        instructorName = userResult[0].displayName || userResult[0].username;
      }
    }

    // Only allow admins to change isPublished and isRecurring
    const updateData: {
      title: string;
      description: string;
      instructor: string | null;
      instructorId: number | null;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      whatToBring: string | null;
      isWorkshop: boolean;
      propId: number | null;
      updatedAt: ReturnType<typeof sql>;
      lastUpdatedBy: number | null;
      approvedBy?: number | null;
      isPublished?: boolean;
      isRecurring?: boolean;
      recurringSeriesId?: string | null;
      recurringUntil?: string | null;
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
      lastUpdatedBy: currentUserId,
    };

    // Check if event is being published (changing from unpublished to published)
    const wasPublished = currentEvent.isPublished;
    const isBeingPublished = isPublished && !wasPublished && userIsAdmin;

    // Only update isPublished if user is admin
    if (userIsAdmin) {
      updateData.isPublished = isPublished;
      // Set approvedBy when publishing an event (changing from unpublished to published)
      if (isBeingPublished && currentUserId !== null) {
        updateData.approvedBy = currentUserId;
      }
    }
    // Both admins and instructors can update isRecurring
    // Only update isRecurring if not converting to recurring (that's handled separately)
    // For existing recurring events, preserve isRecurring: true
    // For non-recurring events being updated, set based on form value
    if (!isRecurringEvent) {
      updateData.isRecurring = isRecurring;
    } else {
      // Preserve isRecurring for existing recurring events
      updateData.isRecurring = true;
    }
    
    // Update recurringUntil if it was provided in the form
    // If recurringUntil is undefined, it means the field wasn't in the form (non-recurring event)
    // If recurringUntil is null, it means user cleared it (set to null)
    // If recurringUntil has a value, use it
    if (recurringUntil !== undefined) {
      updateData.recurringUntil = recurringUntil;
    }

    // CRITICAL: Check if event has recurringSeriesId BEFORE any conversion logic
    // This prevents accidentally triggering conversion when event is already part of a series
    // even if isRecurring flag is temporarily false
    const hasRecurringSeriesId = currentEvent.recurringSeriesId !== null;
    
    // Handle converting recurring event to non-recurring (admins and instructors)
    // Note: This only converts the current event, not the entire series
    if (isRecurringEvent && !isRecurring) {
      // Convert only the current event to non-recurring
      // Other events in the series remain as recurring events
      await db
        .update(events)
        .set({
          ...updateData,
          isRecurring: false,
          recurringSeriesId: null,
        })
        .where(eq(events.id, eventId));

      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/api/timetable");
      revalidateTag("timetable-public");

      // Ensure title and instructorName are not null before creating slug
      if (title && instructorName) {
        revalidatePath(
          `/event/${createEventSlug(eventId, title, instructorName)}`,
        );
      }

      return { success: true };
    }

    // Handle case where event has recurringSeriesId but isRecurring is false
    // This can happen due to data inconsistencies - just update the event and restore isRecurring flag
    if (hasRecurringSeriesId && !isRecurringEvent && isRecurring) {
      // Event is part of a series but isRecurring flag was false - restore it
      await db
        .update(events)
        .set({
          ...updateData,
          isRecurring: true, // Restore the flag
        })
        .where(eq(events.id, eventId));
      
      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/api/timetable");
      revalidateTag("timetable-public");
      
      if (title && instructorName) {
        revalidatePath(`/event/${createEventSlug(eventId, title, instructorName)}`);
      }
      
      return { success: true };
    }

    // Handle converting non-recurring event to recurring (admins and instructors)
    // IMPORTANT: Do NOT convert if event already has a recurringSeriesId (even if isRecurring is false)
    // This prevents duplicate creation when updating events that are part of a series
    if (!isRecurringEvent && isRecurring && !hasRecurringSeriesId) {
      // Validate recurringUntil for instructors
      if (!userIsAdmin && userIsInstructor) {
        if (!recurringUntil) {
          return {
            success: false,
            error: "Please specify an end date for recurring events.",
          };
        }
        // Validate that recurringUntil is after the start date
        const startDateObj = new Date(date);
        const endDateObj = new Date(recurringUntil);
        if (endDateObj < startDateObj) {
          return {
            success: false,
            error: "End date must be after the start date.",
          };
        }
      }

      // Double-check: Make sure this event is truly not part of a recurring series
      // This prevents accidentally creating duplicates if there's a data inconsistency
      const verifyEvent = await db
        .select({
          recurringSeriesId: events.recurringSeriesId,
          isRecurring: events.isRecurring,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (verifyEvent.length === 0) {
        return { success: false, error: "Event not found." };
      }

      // If event already has a recurringSeriesId, don't convert (it's already part of a series)
      if (verifyEvent[0].recurringSeriesId !== null) {
        // Event is already part of a recurring series, just update it normally
        // This prevents duplicate creation when updating recurring events
        await db.update(events).set(updateData).where(eq(events.id, eventId));
        
        revalidatePath("/admin");
        revalidatePath("/");
        revalidatePath("/api/timetable");
        revalidateTag("timetable-public");
        
        if (title && instructorName) {
          revalidatePath(`/event/${createEventSlug(eventId, title, instructorName)}`);
        }
        
        return { success: true };
      }

      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID();

      const startDate = new Date(date);
      const eventDates: string[] = [];

      if (!userIsAdmin && userIsInstructor && recurringUntil) {
        // For instructors: create all events up to recurringUntil
        const endDate = new Date(recurringUntil);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          eventDates.push(currentDate.toISOString().split("T")[0]);
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else {
        // For admins: create only 1 week ahead (initial event + next week = 2 events total)
        // Events will be automatically extended weekly
        eventDates.push(startDate.toISOString().split("T")[0]);
        const nextWeekDate = new Date(startDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        eventDates.push(nextWeekDate.toISOString().split("T")[0]);
      }

      if (eventDates.length === 0) {
        return {
          success: false,
          error: "No valid dates found for recurring event.",
        };
      }

      // Check if events with these dates already exist to prevent duplicates
      // Note: recurringSeriesId is new, so we check for any events with these dates and same title/instructor
      // to prevent accidental duplicates
      const existingEvents = await db
        .select({ date: events.date })
        .from(events)
        .where(
          and(
            inArray(events.date, eventDates),
            eq(events.title, title),
            eq(events.instructor, instructorName)
          )
        );

      const existingDates = new Set(existingEvents.map((e) => e.date));

      // Update the current event to be part of the recurring series
      await db
        .update(events)
        .set({
          ...updateData,
          recurringSeriesId,
          isRecurring: true,
          recurringUntil: recurringUntil || null,
        })
        .where(eq(events.id, eventId));

      // Create additional events for remaining dates (skip the first date as it's the current event)
      // Only create events that don't already exist
      const datesToCreate = eventDates.slice(1).filter((eventDate) => !existingDates.has(eventDate));
      
      if (datesToCreate.length > 0) {
        const additionalEventValues = datesToCreate.map((eventDate) => ({
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
          recurringUntil: recurringUntil || null,
          lastUpdatedBy: currentUserId,
          approvedBy: isPublished && currentUserId ? currentUserId : null,
        }));

        await db.insert(events).values(additionalEventValues);
      }

      // Send recurring workshop info email to instructor when converting to recurring
      if (instructorId) {
        try {
          // Fetch instructor details for email
          const instructorResult = await db
            .select({
              email: users.email,
              displayName: users.displayName,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, instructorId))
            .limit(1);

          if (instructorResult.length > 0) {
            const instructorEmail = instructorResult[0].email;
            const instructorDisplayName =
              instructorResult[0].displayName || instructorResult[0].username;

            if (instructorEmail) {
              try {
                await sendRecurringWorkshopInfoEmail({
                  instructorName: instructorDisplayName,
                  instructorEmail,
                });
              } catch (emailError) {
                console.error(
                  `Failed to send recurring workshop info email to ${instructorEmail}:`,
                  emailError,
                );
                // Don't fail the update if email fails
              }
            }
          }
        } catch (error) {
          console.error(
            "Error sending recurring workshop info email:",
            error,
          );
          // Don't fail the update if email fails
        }
      }

      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/api/timetable");
      revalidateTag("timetable-public");

      return { success: true };
    }

    // Handle recurring events - update all events in the series (admin only)
    // Instructors can only update single events in a recurring series
    if (isRecurringEvent && userIsAdmin && currentEvent.recurringSeriesId) {
      // Double-check: Verify the event is still part of the recurring series
      // This prevents issues if the event was modified between fetching and updating
      const verifySeriesEvent = await db
        .select({
          recurringSeriesId: events.recurringSeriesId,
          isRecurring: events.isRecurring,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (verifySeriesEvent.length === 0) {
        return { success: false, error: "Event not found." };
      }

      // If event is no longer part of a recurring series, just update the single event
      if (verifySeriesEvent[0].recurringSeriesId !== currentEvent.recurringSeriesId || 
          !verifySeriesEvent[0].isRecurring) {
        await db.update(events).set(updateData).where(eq(events.id, eventId));
        
        revalidatePath("/admin");
        revalidatePath("/");
        revalidatePath("/api/timetable");
        revalidateTag("timetable-public");
        
        if (title && instructorName) {
          revalidatePath(`/event/${createEventSlug(eventId, title, instructorName)}`);
        }
        
        return { success: true };
      }

      // Check if start date changed - if so, we need to recalculate dates
      const startDateChanged = currentEvent.date !== date;

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
          .orderBy(asc(events.date));

        if (seriesEvents.length > 0) {
          const originalStartDate = new Date(currentEvent.date);
          const newStartDate = new Date(date);
          const dateDiff = Math.round(
            (newStartDate.getTime() - originalStartDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          // Collect all new dates to check for duplicates before updating
          const newDates = new Map<number, string>();
          for (const seriesEvent of seriesEvents) {
            const originalDate = new Date(seriesEvent.date);
            const newDate = new Date(originalDate);
            newDate.setDate(newDate.getDate() + dateDiff);
            const newDateStr = newDate.toISOString().split("T")[0];
            newDates.set(seriesEvent.id, newDateStr);
          }

          // Check if any of the new dates already exist in the series (to prevent duplicates)
          const dateValues = Array.from(newDates.values());
          const existingEvents = await db
            .select({ id: events.id, date: events.date })
            .from(events)
            .where(
              and(
                eq(events.recurringSeriesId, currentEvent.recurringSeriesId),
                inArray(events.date, dateValues)
              )
            );

          const existingDates = new Set(existingEvents.map((e) => e.date));

          // Update all events in the series with new dates, but skip if date already exists
          for (const seriesEvent of seriesEvents) {
            const newDateStr = newDates.get(seriesEvent.id);
            if (!newDateStr) continue;

            // Skip updating if this date already exists for another event in the series
            if (existingDates.has(newDateStr) && existingEvents.some(e => e.id !== seriesEvent.id && e.date === newDateStr)) {
              console.warn(`Skipping update for event ${seriesEvent.id}: date ${newDateStr} already exists in series`);
              continue;
            }

            await db
              .update(events)
              .set({
                ...updateData,
                date: newDateStr,
              })
              .where(eq(events.id, seriesEvent.id));
          }
        }
      } else {
        // Start date didn't change
        // First, update the specific event being edited with all fields (including date)
        await db
          .update(events)
          .set(updateData)
          .where(eq(events.id, eventId));

        // Then, update other events in the series with all fields EXCEPT date
        // (they should keep their original dates to maintain the weekly schedule)
        const { date: _, ...updateDataWithoutDate } = updateData;
        await db
          .update(events)
          .set(updateDataWithoutDate)
          .where(
            and(
              eq(events.recurringSeriesId, currentEvent.recurringSeriesId),
              eq(events.isRecurring, true),
              sql`${events.id} != ${eventId}` // Exclude the event we just updated
            )
          );
      }
    } else {
      // Non-recurring event or non-admin updating - update single event
      await db.update(events).set(updateData).where(eq(events.id, eventId));
    }

    // Send instructor assignment email if admin assigned/changed instructorId
    const oldInstructorId = currentEvent.instructorId;
    const instructorIdChanged =
      oldInstructorId !== instructorId && instructorId !== null;
    if (userIsAdmin && instructorIdChanged && instructorId !== null) {
      try {
        // Fetch instructor details for email
        // instructorId is guaranteed to be non-null here due to the condition above
        const instructorResult = await db
          .select({
            email: users.email,
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, instructorId!))
          .limit(1);

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email;
          const instructorDisplayName =
            instructorResult[0].displayName || instructorResult[0].username;

          if (!instructorEmail) {
            console.error(
              `Instructor ${instructorId} (${instructorDisplayName}) does not have an email address. Cannot send assignment email.`,
            );
          } else {
            try {
              const eventSlug = createEventSlug(eventId, title, instructorName);
              await sendInstructorAssignedEmail({
                instructorName: instructorDisplayName,
                instructorEmail,
                eventTitle: title,
                eventDate: date,
                eventStartTime: start_time,
                eventEndTime: end_time,
                eventLocation: location,
                eventSlug,
              });
            } catch (emailError) {
              console.error(
                `Failed to send instructor assignment email to ${instructorEmail}:`,
                emailError,
              );
            }
          }
        } else {
          console.error(
            `Instructor with id ${instructorId} not found. Cannot send assignment email.`,
          );
        }
      } catch (error) {
        console.error("Error sending instructor assignment email:", error);
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
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, currentEvent.instructorId))
          .limit(1);

        if (instructorResult.length > 0) {
          const instructorEmail = instructorResult[0].email;
          const instructorDisplayName =
            instructorResult[0].displayName || instructorResult[0].username;

          if (!instructorEmail) {
            console.error(
              `Instructor ${currentEvent.instructorId} (${instructorDisplayName}) does not have an email address. Cannot send approval email.`,
            );
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
              });
            } catch (emailError) {
              console.error(
                `Failed to send approval email to instructor ${instructorEmail}:`,
                emailError,
              );
            }
          }
        } else {
          console.error(
            `Instructor with id ${currentEvent.instructorId} not found. Cannot send approval email.`,
          );
        }
      } catch (error) {
        console.error("Error sending approval email:", error);
        // Don't fail the update if email fails
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");

    // Ensure title and instructorName are not null before creating slug
    if (title && instructorName) {
      revalidatePath(
        `/event/${createEventSlug(eventId, title, instructorName)}`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(
  eventId: number,
  cancellationMessage?: string | null,
) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete events.");
  }

  // Check authorization: must be admin OR (instructor AND matching event instructor)
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    // Check if user is instructor
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        isInstructor: users.isInstructor,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].isInstructor) {
      throw new Error(
        "Unauthorized. Only admins and event instructors can delete events.",
      );
    }

    const currentUserId = userResult[0].id;

    // Fetch event to check instructor
    const eventResult = await db
      .select({
        instructor: events.instructor,
        instructorId: events.instructorId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (eventResult.length === 0) {
      throw new Error("Event not found.");
    }

    // Check authorization: if instructorId exists, check that; otherwise check instructor string
    const eventInstructorId = eventResult[0].instructorId;
    if (eventInstructorId !== null) {
      // Match instructorId
      if (eventInstructorId !== currentUserId) {
        throw new Error(
          "Unauthorized. You can only delete events you are instructing.",
        );
      }
    } else {
      // Fallback to instructor string comparison
      if (eventResult[0].instructor !== userResult[0].username) {
        throw new Error(
          "Unauthorized. You can only delete events you are instructing.",
        );
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
      .limit(1);

    if (eventResults.length === 0) {
      throw new Error("Event not found.");
    }

    const event = eventResults[0];

    // Get instructor name (prefer displayName, fallback to username, then instructor string)
    const instructorName = event.instructorProfile
      ? event.instructorProfile.displayName || event.instructorProfile.username
      : event.instructor || "Unknown Instructor";

    // Fetch all participations for this event
    const eventParticipations = await db
      .select({
        participantName: participations.participantName,
        participantEmail: participations.participantEmail,
      })
      .from(participations)
      .where(eq(participations.eventId, eventId));

    // Send cancellation emails to all participants
    if (eventParticipations.length > 0) {
      const emailPromises = eventParticipations.map((participation) =>
        sendEventCancelledEmail({
          participantName: participation.participantName,
          participantEmail: participation.participantEmail,
          eventTitle: event.title,
          eventDate: event.date,
          eventStartTime: event.startTime,
          eventEndTime: event.endTime,
          eventLocation: event.location || "",
          instructorName: instructorName,
          cancellationMessage: cancellationMessage || null,
        }).catch((error) => {
          // Log error but don't fail the deletion if email fails
          console.error(
            `Failed to send cancellation email to ${participation.participantEmail}:`,
            error,
          );
        }),
      );

      // Wait for all emails to be sent (or fail gracefully)
      await Promise.allSettled(emailPromises);
    }

    // Delete the event (this will cascade delete participations due to foreign key constraint)
    await db.delete(events).where(eq(events.id, eventId));

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");
  } catch (error) {
    console.error("Error deleting workshop:", error);
    throw error;
  }
}

export async function deleteEventAndFutureInstructorEvents(
  eventId: number,
  cancellationMessage?: string | null,
) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized. You must be signed in to delete events.");
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    throw new Error(
      "Unauthorized. Only admins can delete events and all future instructor events.",
    );
  }

  try {
    // Fetch the current event to get instructor info and date
    const currentEventResult = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        instructorId: events.instructorId,
        recurringSeriesId: events.recurringSeriesId,
        isRecurring: events.isRecurring,
        instructorProfile: {
          displayName: users.displayName,
          username: users.username,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (currentEventResult.length === 0) {
      throw new Error("Event not found.");
    }

    const currentEvent = currentEventResult[0];
    const currentEventDate = currentEvent.date;
    const currentInstructorId = currentEvent.instructorId;
    const currentInstructor = currentEvent.instructor;

    // Build matching conditions for future events
    let matchingCondition;
    if (currentInstructorId !== null && currentInstructorId !== undefined) {
      // Match by instructorId
      matchingCondition = and(
        eq(events.instructorId, currentInstructorId),
        gte(events.date, currentEventDate),
      );
    } else {
      // Match by instructor string
      if (!currentInstructor) {
        throw new Error(
          "Cannot delete future events: event has no instructor information.",
        );
      }
      matchingCondition = and(
        eq(events.instructor, currentInstructor),
        gte(events.date, currentEventDate),
      );
    }

    // Fetch all matching future events (including the current one)
    const eventsToDelete = await db
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
      .where(matchingCondition)
      .orderBy(asc(events.date), asc(events.startTime));

    if (eventsToDelete.length === 0) {
      throw new Error("No events found to delete.");
    }

    // Get instructor name for emails (prefer displayName, fallback to username, then instructor string)
    const instructorName = currentEvent.instructorProfile
      ? currentEvent.instructorProfile.displayName ||
        currentEvent.instructorProfile.username
      : currentEvent.instructor || "Unknown Instructor";

    // Process each event: send cancellation emails and delete
    for (const eventToDelete of eventsToDelete) {
      // Fetch all participations for this event
      const eventParticipations = await db
        .select({
          participantName: participations.participantName,
          participantEmail: participations.participantEmail,
        })
        .from(participations)
        .where(eq(participations.eventId, eventToDelete.id));

      // Send cancellation emails to all participants
      if (eventParticipations.length > 0) {
        const emailPromises = eventParticipations.map((participation) =>
          sendEventCancelledEmail({
            participantName: participation.participantName,
            participantEmail: participation.participantEmail,
            eventTitle: eventToDelete.title,
            eventDate: eventToDelete.date,
            eventStartTime: eventToDelete.startTime,
            eventEndTime: eventToDelete.endTime,
            eventLocation: eventToDelete.location || "",
            instructorName: instructorName,
            cancellationMessage: cancellationMessage || null,
          }).catch((error) => {
            // Log error but don't fail the deletion if email fails
            console.error(
              `Failed to send cancellation email to ${participation.participantEmail}:`,
              error,
            );
          }),
        );

        // Wait for all emails to be sent (or fail gracefully)
        await Promise.allSettled(emailPromises);
      }

      // Delete the event (this will cascade delete participations due to foreign key constraint)
      await db.delete(events).where(eq(events.id, eventToDelete.id));
    }

    // If the event was part of a recurring series, unset isRecurring for all events in that series
    if (currentEvent.recurringSeriesId) {
      await db
        .update(events)
        .set({ isRecurring: false })
        .where(eq(events.recurringSeriesId, currentEvent.recurringSeriesId));
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");
  } catch (error) {
    console.error("Error deleting event and future instructor events:", error);
    throw error;
  }
}

export async function deleteBooking(participationId: number, eventId: number) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    throw new Error(
      "Unauthorized. You must be signed in to delete participations.",
    );
  }

  try {
    // Fetch event title and instructor for revalidation
    const eventResults = await db
      .select({ title: events.title, instructor: events.instructor })
      .from(events)
      .where(eq(events.id, eventId));

    await db
      .delete(participations)
      .where(eq(participations.id, participationId));

    // Update event participation count
    await db
      .update(events)
      .set({ currentBookings: sql`${events.currentBookings} - 1` })
      .where(eq(events.id, eventId));

    revalidatePath("/admin");
    revalidatePath("/");
    if (eventResults.length > 0 && eventResults[0].instructor) {
      revalidatePath(
        `/event/${createEventSlug(eventId, eventResults[0].title, eventResults[0].instructor)}`,
      );
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
}

/**
 * Returns the Sunday of the next week (the week after the current one) in UTC.
 * E.g. if today is Monday Feb 2, returns Sunday Feb 15.
 */
function getNextWeekSundayUTC(todayUTC: Date): Date {
  const dayOfWeek = todayUTC.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const currentWeekMonday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - daysSinceMonday));
  const nextWeekSunday = new Date(Date.UTC(currentWeekMonday.getUTCFullYear(), currentWeekMonday.getUTCMonth(), currentWeekMonday.getUTCDate() + 7 + 6));
  return nextWeekSunday;
}

/**
 * Returns the Monday-Sunday range for current week and previous week in UTC.
 * Returns: { previousWeekMonday: string, currentWeekSunday: string }
 * Dates are formatted as YYYY-MM-DD strings.
 */
function getCurrentAndPreviousWeekRange(): { previousWeekMonday: string; currentWeekSunday: string } {
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  
  // Calculate current week Monday
  const dayOfWeek = todayUTC.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const currentWeekMonday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - daysSinceMonday));
  
  // Calculate current week Sunday
  const currentWeekSunday = new Date(Date.UTC(currentWeekMonday.getUTCFullYear(), currentWeekMonday.getUTCMonth(), currentWeekMonday.getUTCDate() + 6));
  
  // Calculate previous week Monday (7 days before current week Monday)
  const previousWeekMonday = new Date(Date.UTC(currentWeekMonday.getUTCFullYear(), currentWeekMonday.getUTCMonth(), currentWeekMonday.getUTCDate() - 7));
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  return {
    previousWeekMonday: formatDate(previousWeekMonday),
    currentWeekSunday: formatDate(currentWeekSunday),
  };
}

/**
 * Extends recurring events to ensure there's always events up to the Sunday of the next week.
 * This function is called by the cron job to automatically extend recurring event series.
 */
export async function extendRecurringEvents() {
  try {
    // Get all unique recurring series IDs
    const recurringSeries = await db
      .selectDistinct({ recurringSeriesId: events.recurringSeriesId })
      .from(events)
      .where(
        and(eq(events.isRecurring, true), isNotNull(events.recurringSeriesId)),
      );

    // Use UTC dates to avoid timezone issues; extend to Sunday of the next week
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const targetDate = getNextWeekSundayUTC(todayUTC);

    let totalEventsCreated = 0;

    for (const series of recurringSeries) {
      if (!series.recurringSeriesId) continue;

      // Get all events in this series that are still marked as recurring, ordered by date descending
      const seriesEvents = await db
        .select({
          id: events.id,
          date: events.date,
          title: events.title,
          description: events.description,
          instructor: events.instructor,
          instructorId: events.instructorId,
          startTime: events.startTime,
          endTime: events.endTime,
          location: events.location,
          whatToBring: events.whatToBring,
          isWorkshop: events.isWorkshop,
          isPublished: events.isPublished,
          propId: events.propId,
          recapVideoId: events.recapVideoId,
          recurringUntil: events.recurringUntil,
        })
        .from(events)
        .where(
          and(
            eq(events.recurringSeriesId, series.recurringSeriesId),
            eq(events.isRecurring, true),
          ),
        )
        .orderBy(desc(events.date));

      if (seriesEvents.length === 0) continue;

      // Get the latest event (first in descending order)
      const latestEvent = seriesEvents[0];
      
      // Check if this series has a recurringUntil date
      const recurringUntil = latestEvent.recurringUntil;
      
      // If recurringUntil exists, check if we've already reached or passed it
      if (recurringUntil) {
        const [endYear, endMonth, endDay] = recurringUntil.split("-").map(Number);
        const recurringUntilDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));
        
        // If recurringUntil is in the past or today, don't extend
        if (recurringUntilDate < todayUTC) {
          continue; // Skip this series, it has ended
        }
        
        // Use recurringUntil as the target date if it's earlier than the default target
        const effectiveTargetDate = recurringUntilDate < targetDate ? recurringUntilDate : targetDate;
        
        // Parse date string (YYYY-MM-DD) and work with UTC to avoid timezone issues
        const latestEventDateStr = latestEvent.date;
        const [year, month, day] = latestEventDateStr.split("-").map(Number);
        const latestEventDate = new Date(Date.UTC(year, month - 1, day));
        
        // Check if we need to extend (latest event date is before effective target date)
        if (latestEventDate < effectiveTargetDate) {
          // Get ALL existing dates in the series (including non-recurring events) to avoid duplicates
          const allSeriesEvents = await db
            .select({ date: events.date })
            .from(events)
            .where(eq(events.recurringSeriesId, series.recurringSeriesId));
          const existingDates = new Set(allSeriesEvents.map((e) => e.date));

          // Create events until the effective target date is covered
          const eventsToCreate: Array<{
            title: string;
            description: string | null;
            instructor: string | null;
            instructorId: number | null;
            date: string;
            startTime: string;
            endTime: string;
            location: string | null;
            whatToBring: string | null;
            isWorkshop: boolean;
            isPublished: boolean;
            propId: number | null;
            recurringSeriesId: string;
            isRecurring: boolean;
            recapVideoId: string | null;
            recurringUntil: string | null;
          }> = [];

          // Start from 7 days after the latest event date
          let currentDate = new Date(Date.UTC(year, month - 1, day + 7));

          // Create events until we've reached the effective target date
          while (currentDate <= effectiveTargetDate) {
            // Format as YYYY-MM-DD using UTC methods to avoid timezone shifts
            const dateStr = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;

            // Only create if it doesn't already exist
            if (!existingDates.has(dateStr)) {
              eventsToCreate.push({
                title: latestEvent.title,
                description: latestEvent.description,
                instructor: latestEvent.instructor,
                instructorId: latestEvent.instructorId,
                date: dateStr,
                startTime: latestEvent.startTime,
                endTime: latestEvent.endTime,
                location: latestEvent.location,
                whatToBring: latestEvent.whatToBring,
                isWorkshop: latestEvent.isWorkshop,
                isPublished: latestEvent.isPublished,
                propId: latestEvent.propId,
                recurringSeriesId: series.recurringSeriesId,
                isRecurring: true,
                recapVideoId: latestEvent.recapVideoId,
                recurringUntil: recurringUntil,
              });
            }

            // Add 7 days using UTC date arithmetic
            currentDate = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate() + 7
            ));
          }

          // Insert new events if any
          if (eventsToCreate.length > 0) {
            await db.insert(events).values(eventsToCreate);
            totalEventsCreated += eventsToCreate.length;
          }
        }
        continue; // Skip the default extension logic for series with recurringUntil
      }
      
      // For series without recurringUntil (indefinite), use default extension logic
      // Parse date string (YYYY-MM-DD) and work with UTC to avoid timezone issues
      // Date strings from database are in YYYY-MM-DD format
      const latestEventDateStr = latestEvent.date;
      const [year, month, day] = latestEventDateStr.split("-").map(Number);
      const latestEventDate = new Date(Date.UTC(year, month - 1, day));
      
      // Check if we need to extend (latest event date is before target date)
      if (latestEventDate < targetDate) {
        // Get ALL existing dates in the series (including non-recurring events) to avoid duplicates
        // This prevents creating duplicates when events were manually converted to non-recurring
        const allSeriesEvents = await db
          .select({ date: events.date })
          .from(events)
          .where(eq(events.recurringSeriesId, series.recurringSeriesId));
        const existingDates = new Set(allSeriesEvents.map((e) => e.date));

        // Create events until the Sunday of the next week is covered
        const eventsToCreate: Array<{
          title: string;
          description: string | null;
          instructor: string | null;
          instructorId: number | null;
          date: string;
          startTime: string;
          endTime: string;
          location: string | null;
          whatToBring: string | null;
          isWorkshop: boolean;
          isPublished: boolean;
          propId: number | null;
          recurringSeriesId: string;
          isRecurring: boolean;
          recapVideoId: string | null;
          recurringUntil: string | null;
        }> = [];

        // Start from 7 days after the latest event date
        // Use UTC date arithmetic to avoid timezone issues
        let currentDate = new Date(Date.UTC(year, month - 1, day + 7));

        // Create events until we've reached the Sunday of the next week
        while (currentDate <= targetDate) {
          // Format as YYYY-MM-DD using UTC methods to avoid timezone shifts
          const dateStr = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;

            // Only create if it doesn't already exist
            if (!existingDates.has(dateStr)) {
              eventsToCreate.push({
                title: latestEvent.title,
                description: latestEvent.description,
                instructor: latestEvent.instructor,
                instructorId: latestEvent.instructorId,
                date: dateStr,
                startTime: latestEvent.startTime,
                endTime: latestEvent.endTime,
                location: latestEvent.location,
                whatToBring: latestEvent.whatToBring,
                isWorkshop: latestEvent.isWorkshop,
                isPublished: latestEvent.isPublished,
                propId: latestEvent.propId,
                recurringSeriesId: series.recurringSeriesId,
                isRecurring: true,
                recapVideoId: latestEvent.recapVideoId,
                recurringUntil: null, // Indefinite recurring events have null recurringUntil
              });
            }

          // Add 7 days using UTC date arithmetic
          currentDate = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate() + 7
          ));
        }

        // Insert new events if any
        if (eventsToCreate.length > 0) {
          await db.insert(events).values(eventsToCreate);
          totalEventsCreated += eventsToCreate.length;
        }
      }
    }

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");

    return {
      success: true,
      eventsCreated: totalEventsCreated,
      seriesProcessed: recurringSeries.length,
    };
  } catch (error) {
    console.error("Error extending recurring events:", error);
    return {
      success: false,
      error: "Failed to extend recurring events",
      eventsCreated: 0,
      seriesProcessed: 0,
    };
  }
}

/**
 * Get recurring events from specified date range that are candidates for copying.
 * Only returns published recurring events without a recurringUntil date.
 * @param dateFrom - Start date (YYYY-MM-DD format)
 * @param dateTo - End date (YYYY-MM-DD format)
 */
export async function getRecurringEventsCopyCandidates(
  dateFrom?: string,
  dateTo?: string,
) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in.",
      };
    }

    // Check admin authorization
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return {
        success: false,
        error: "Unauthorized. Only admins can access this function.",
      };
    }

    // Use provided date range or calculate default (current and previous week)
    let startDate: string;
    let endDate: string;
    
    if (dateFrom && dateTo) {
      startDate = dateFrom;
      endDate = dateTo;
    } else {
      // Fallback to default range if not provided
      const { previousWeekMonday, currentWeekSunday } = getCurrentAndPreviousWeekRange();
      startDate = previousWeekMonday;
      endDate = currentWeekSunday;
    }

    // Validate date range
    if (startDate > endDate) {
      return {
        success: false,
        error: "Start date must be before end date",
      };
    }

    // Query events
    const candidateEvents = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        instructor: events.instructor,
        location: events.location,
        recurringSeriesId: events.recurringSeriesId,
      })
      .from(events)
      .where(
        and(
          eq(events.isPublished, true),
          eq(events.isRecurring, true),
          isNull(events.recurringUntil),
          gte(events.date, startDate),
          lte(events.date, endDate),
        ),
      )
      .orderBy(asc(events.date), asc(events.startTime));

    return {
      success: true,
      events: candidateEvents,
    };
  } catch (error) {
    console.error("Error fetching recurring events candidates:", error);
    return {
      success: false,
      error: "Failed to fetch recurring events candidates",
    };
  }
}

/**
 * Copy selected recurring events to the next calendar week.
 * Skips duplicates based on recurringSeriesId, date, startTime, and endTime.
 */
export async function copySelectedRecurringEventsToNextWeek(
  selectedEventIds: number[],
) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. You must be signed in.",
        copied: 0,
        skipped: 0,
        skippedItems: [],
      };
    }

    // Check admin authorization
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return {
        success: false,
        error: "Unauthorized. Only admins can copy events.",
        copied: 0,
        skipped: 0,
        skippedItems: [],
      };
    }

    if (selectedEventIds.length === 0) {
      return {
        success: false,
        error: "No events selected for copying.",
        copied: 0,
        skipped: 0,
        skippedItems: [],
      };
    }

    // Load selected source events
    const sourceEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        instructor: events.instructor,
        instructorId: events.instructorId,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        whatToBring: events.whatToBring,
        isWorkshop: events.isWorkshop,
        isPublished: events.isPublished,
        propId: events.propId,
        recurringSeriesId: events.recurringSeriesId,
        isRecurring: events.isRecurring,
        recurringUntil: events.recurringUntil,
        recapVideoId: events.recapVideoId,
        maxCapacity: events.maxCapacity,
      })
      .from(events)
      .where(inArray(events.id, selectedEventIds));

    if (sourceEvents.length === 0) {
      return {
        success: false,
        error: "No valid events found for the selected IDs.",
        copied: 0,
        skipped: 0,
        skippedItems: [],
      };
    }

    let copiedCount = 0;
    let skippedCount = 0;
    const skippedItems: Array<{ eventId: number; reason: string }> = [];
    const eventsToInsert: Array<{
      title: string;
      description: string | null;
      instructor: string | null;
      instructorId: number | null;
      date: string;
      startTime: string;
      endTime: string;
      location: string | null;
      whatToBring: string | null;
      isWorkshop: boolean;
      isPublished: boolean;
      propId: number | null;
      recurringSeriesId: string | null;
      isRecurring: boolean;
      recurringUntil: string | null;
      recapVideoId: string | null;
      maxCapacity: number;
      currentBookings: number;
    }> = [];

    for (const sourceEvent of sourceEvents) {
      // Calculate target date: same weekday in next calendar week (7 days after)
      const sourceDate = new Date(sourceEvent.date);
      const targetDate = new Date(sourceDate);
      targetDate.setUTCDate(sourceDate.getUTCDate() + 7);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      // Check for duplicate
      const duplicateConditions = [
        eq(events.date, targetDateStr),
        eq(events.startTime, sourceEvent.startTime),
        eq(events.endTime, sourceEvent.endTime),
      ];
      
      // Only add recurringSeriesId condition if it exists
      if (sourceEvent.recurringSeriesId) {
        duplicateConditions.push(eq(events.recurringSeriesId, sourceEvent.recurringSeriesId));
      }
      
      const existingEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existingEvents.length > 0) {
        skippedCount++;
        skippedItems.push({
          eventId: sourceEvent.id,
          reason: "Duplicate event already exists for target date",
        });
        continue;
      }

      // Prepare event for insertion
      eventsToInsert.push({
        title: sourceEvent.title,
        description: sourceEvent.description,
        instructor: sourceEvent.instructor,
        instructorId: sourceEvent.instructorId,
        date: targetDateStr,
        startTime: sourceEvent.startTime,
        endTime: sourceEvent.endTime,
        location: sourceEvent.location,
        whatToBring: sourceEvent.whatToBring,
        isWorkshop: sourceEvent.isWorkshop,
        isPublished: sourceEvent.isPublished,
        propId: sourceEvent.propId,
        recurringSeriesId: sourceEvent.recurringSeriesId,
        isRecurring: sourceEvent.isRecurring,
        recurringUntil: sourceEvent.recurringUntil,
        recapVideoId: sourceEvent.recapVideoId,
        maxCapacity: sourceEvent.maxCapacity,
        currentBookings: 0, // Reset booking counter
      });
    }

    // Insert all events in a single transaction
    if (eventsToInsert.length > 0) {
      await db.insert(events).values(eventsToInsert);
      copiedCount = eventsToInsert.length;
    }

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/admin/recurring_events");
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");

    return {
      success: true,
      copied: copiedCount,
      skipped: skippedCount,
      skippedItems,
    };
  } catch (error) {
    console.error("Error copying recurring events:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to copy recurring events",
      copied: 0,
      skipped: 0,
      skippedItems: [],
    };
  }
}

/**
 * Form action wrapper for copying recurring events.
 * Extracts selectedEventIds from FormData and calls copySelectedRecurringEventsToNextWeek.
 */
export async function copyRecurringEventsAction(formData: FormData) {
  const selectedEventIds = formData
    .getAll("selectedEventIds")
    .map((id) => Number.parseInt(id.toString(), 10))
    .filter((id) => !Number.isNaN(id));

  return await copySelectedRecurringEventsToNextWeek(selectedEventIds);
}

/**
 * Server action wrapper for extendRecurringEvents with admin authorization check.
 * This allows admins to manually trigger the recurring events extension from the UI.
 */
export async function runExtendRecurringEvents() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to run this action.",
    };
  }

  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can run this action.",
    };
  }

  return await extendRecurringEvents();
}

export async function updateEventRecapVideo(
  eventId: number,
  recapVideoId: string | null,
) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to add recap videos.",
    };
  }

  try {
    // Get current user's email to exclude them from notifications
    const clerkUser = await currentUser();
    const currentUserEmail = clerkUser ? getUserEmail(clerkUser) : null;

    // Check if this is adding a recap (not removing)
    const wasAddingRecap = recapVideoId !== null;

    // Verify event exists and is a workshop, fetch full event details
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        isWorkshop: events.isWorkshop,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        instructor: events.instructor,
        instructorId: events.instructorId,
        recapVideoId: events.recapVideoId,
        instructorProfile: {
          displayName: users.displayName,
          username: users.username,
          email: users.email,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.instructorId, users.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (eventResult.length === 0) {
      return { success: false, error: "Event not found" };
    }

    const event = eventResult[0];

    if (!event.isWorkshop) {
      return {
        success: false,
        error: "Recap videos can only be added to workshops",
      };
    }

    // Only send notifications if we're adding a recap (not removing)
    const shouldSendNotifications = wasAddingRecap && !event.recapVideoId;

    // Update the recap video ID
    await db
      .update(events)
      .set({
        recapVideoId: recapVideoId || null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(events.id, eventId));

    // Send email notifications if recap was added
    if (shouldSendNotifications && recapVideoId) {
      // Get instructor name and email
      const instructorName = event.instructorProfile
        ? event.instructorProfile.displayName || event.instructorProfile.username
        : event.instructor || null;
      const instructorEmail = event.instructorProfile?.email || null;

      // Fetch all participants for this event
      const eventParticipations = await db
        .select({
          participantName: participations.participantName,
          participantEmail: participations.participantEmail,
        })
        .from(participations)
        .where(eq(participations.eventId, eventId));

      // Create event URL
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
      const eventSlug = createEventSlug(
        event.id,
        event.title,
        instructorName,
      );
      const eventUrl = `${appUrl}/event/${eventSlug}`;

      // Send emails to participants (excluding the user who posted)
      const emailPromises: Promise<{ success: boolean }>[] = [];

      for (const participation of eventParticipations) {
        // Skip if this is the user who posted the recap
        if (
          currentUserEmail &&
          participation.participantEmail.toLowerCase() ===
            currentUserEmail.toLowerCase()
        ) {
          continue;
        }

        emailPromises.push(
          sendRecapAddedEmail({
            recipientName: participation.participantName,
            recipientEmail: participation.participantEmail,
            eventTitle: event.title,
            eventDate: event.date,
            eventStartTime: event.startTime,
            eventEndTime: event.endTime,
            eventLocation: event.location || "",
            instructorName,
            eventUrl,
            recapVideoId,
          }).catch((error) => {
            console.error(
              `Failed to send recap email to ${participation.participantEmail}:`,
              error,
            );
            return { success: false };
          }),
        );
      }

      // Send email to instructor (if exists and not the user who posted)
      if (
        instructorEmail &&
        instructorName &&
        (!currentUserEmail ||
          instructorEmail.toLowerCase() !== currentUserEmail.toLowerCase())
      ) {
        emailPromises.push(
          sendRecapAddedEmail({
            recipientName: instructorName,
            recipientEmail: instructorEmail,
            eventTitle: event.title,
            eventDate: event.date,
            eventStartTime: event.startTime,
            eventEndTime: event.endTime,
            eventLocation: event.location || "",
            instructorName,
            eventUrl,
            recapVideoId,
          }).catch((error) => {
            console.error(
              `Failed to send recap email to instructor ${instructorEmail}:`,
              error,
            );
            return { success: false };
          }),
        );
      }

      // Send all emails in parallel (don't wait for them to complete)
      Promise.all(emailPromises).catch((error) => {
        console.error("Error sending recap notification emails:", error);
      });
    }

    revalidatePath(`/event`);
    revalidatePath("/api/timetable");
    revalidateTag("timetable-public");

    return { success: true };
  } catch (error) {
    console.error("Error updating recap video:", error);
    return { success: false, error: "Failed to update recap video" };
  }
}

export async function promoteUserToAdmin(userId: number) {
  // Check authentication
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to promote users.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can promote users to admin.",
    };
  }

  try {
    // Prevent self-demotion (though this is promotion, not demotion)
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, currentUserId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return { success: false, error: "Current user not found." };
    }

    // Check if user exists
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found." };
    }

    const user = userResult[0];

    // If already admin, return success
    if (user.isAdmin) {
      return { success: true, message: "User is already an admin." };
    }

    // Promote user to admin
    await db
      .update(users)
      .set({ isAdmin: true, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");

    // Send admin promotion email
    if (user.email) {
      try {
        const adminName = user.displayName || user.username;
        await sendAdminPromotedEmail({
          adminName,
          adminEmail: user.email,
        });
      } catch (emailError) {
        console.error(
          `Failed to send admin promotion email to ${user.email}:`,
          emailError,
        );
        // Don't fail the promotion if email fails
      }
    } else {
      console.warn(
        `User ${user.username} (ID: ${userId}) does not have an email address. Cannot send admin promotion email.`,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return { success: false, error: "Failed to promote user to admin" };
  }
}

export async function demoteUserFromAdmin(userId: number) {
  // Check authentication
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to demote users.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can demote users from admin.",
    };
  }

  try {
    // Get current user's database ID
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, currentUserId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return { success: false, error: "Current user not found." };
    }

    const currentUserId_db = currentUserResult[0].id;

    // Prevent self-demotion
    if (userId === currentUserId_db) {
      return {
        success: false,
        error: "You cannot demote yourself from admin.",
      };
    }

    // Check if user exists
    const userResult = await db
      .select({ id: users.id, username: users.username, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found." };
    }

    const user = userResult[0];

    // If not admin, return success
    if (!user.isAdmin) {
      return { success: true, message: "User is not an admin." };
    }

    // Demote user from admin
    await db
      .update(users)
      .set({ isAdmin: false, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Error demoting user from admin:", error);
    return { success: false, error: "Failed to demote user from admin" };
  }
}

export async function deleteUser(userId: number) {
  // Check authentication
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to delete users.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can delete users.",
    };
  }

  try {
    // Get current user's database ID
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, currentUserId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return { success: false, error: "Current user not found." };
    }

    const currentUserId_db = currentUserResult[0].id;

    // Prevent self-deletion
    if (userId === currentUserId_db) {
      return {
        success: false,
        error: "You cannot delete yourself.",
      };
    }

    // Check if user exists
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        clerkUserId: users.clerkUserId,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found." };
    }

    const user = userResult[0];

    // Find and delete all events where user is the instructor
    // This will cascade delete participations and comments for those events
    const userEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.instructorId, userId));

    if (userEvents.length > 0) {
      await db.delete(events).where(eq(events.instructorId, userId));
    }

    // Find all participations for this user in remaining events (events they didn't create)
    const userParticipations = await db
      .select({ eventId: participations.eventId })
      .from(participations)
      .where(eq(participations.clerkUserId, user.clerkUserId));

    // Group participations by eventId and count them
    const participationsByEvent = userParticipations.reduce((acc, participation) => {
      acc[participation.eventId] = (acc[participation.eventId] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Delete all participations for this user
    if (userParticipations.length > 0) {
      await db.delete(participations).where(eq(participations.clerkUserId, user.clerkUserId));

      // Update participation counts for affected events
      for (const [eventId, count] of Object.entries(participationsByEvent)) {
        await db
          .update(events)
          .set({ currentBookings: sql`${events.currentBookings} - ${count}` })
          .where(eq(events.id, parseInt(eventId)))
      }
    }

    // Find and delete all comments for this user in remaining events (events they didn't create)
    const userComments = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.clerkUserId, user.clerkUserId));

    if (userComments.length > 0) {
      await db.delete(comments).where(eq(comments.clerkUserId, user.clerkUserId));
    }

    // Delete user (cascade will handle user_props)
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

/**
 * Normalize prop names by finding and merging duplicates.
 * Duplicates are identified by normalizing names (removing spaces, lowercasing).
 * The canonical name is chosen as the one with spaces (e.g., "contact staff" over "contactstaff").
 * 
 * @returns Object with success status, merged count, and details of merged props
 */
export async function normalizeProps() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to normalize props.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can normalize props.",
    };
  }

  try {
    // Helper function to normalize a prop name for comparison
    const normalizeName = (name: string): string => {
      return name.trim().toLowerCase().replace(/\s+/g, "");
    };

    // Get all props
    const allProps = await db
      .select({
        id: props.id,
        name: props.name,
      })
      .from(props)
      .orderBy(asc(props.name));

    // Group props by normalized name
    const propsByNormalized: Map<string, Array<{ id: number; name: string }>> = new Map();

    for (const prop of allProps) {
      const normalized = normalizeName(prop.name);
      if (!propsByNormalized.has(normalized)) {
        propsByNormalized.set(normalized, []);
      }
      propsByNormalized.get(normalized)!.push(prop);
    }

    // Find duplicates (groups with more than one prop)
    const duplicates: Array<{
      normalized: string;
      props: Array<{ id: number; name: string }>;
      canonical: { id: number; name: string };
    }> = [];

    for (const [normalized, propGroup] of propsByNormalized.entries()) {
      if (propGroup.length > 1) {
        // Choose canonical name: prefer one with spaces, otherwise the first alphabetically
        const canonical = propGroup.reduce((best, current) => {
          const bestHasSpaces = best.name.includes(" ");
          const currentHasSpaces = current.name.includes(" ");
          
          if (currentHasSpaces && !bestHasSpaces) {
            return current;
          }
          if (bestHasSpaces && !currentHasSpaces) {
            return best;
          }
          // If both have spaces or neither has spaces, prefer alphabetically first
          return current.name.localeCompare(best.name) < 0 ? current : best;
        });

        duplicates.push({
          normalized,
          props: propGroup,
          canonical,
        });
      }
    }

    if (duplicates.length === 0) {
      return {
        success: true,
        merged: 0,
        message: "No duplicate props found.",
        details: [],
      };
    }

    // Merge duplicates
    const mergeDetails: Array<{
      canonical: string;
      merged: string[];
      canonicalId: number;
    }> = [];
    let totalMerged = 0;

    for (const duplicate of duplicates) {
      const canonicalId = duplicate.canonical.id;
      const canonicalName = duplicate.canonical.name;
      const duplicateIds = duplicate.props
        .filter((p) => p.id !== canonicalId)
        .map((p) => p.id);
      const duplicateNames = duplicate.props
        .filter((p) => p.id !== canonicalId)
        .map((p) => p.name);

      if (duplicateIds.length === 0) {
        continue;
      }

      // Update user_props references
      await db
        .update(userProps)
        .set({ propId: canonicalId })
        .where(inArray(userProps.propId, duplicateIds));

      // Update events references
      await db
        .update(events)
        .set({ propId: canonicalId })
        .where(inArray(events.propId, duplicateIds));

      // Delete duplicate props
      await db.delete(props).where(inArray(props.id, duplicateIds));

      mergeDetails.push({
        canonical: canonicalName,
        merged: duplicateNames,
        canonicalId,
      });
      totalMerged += duplicateIds.length;
    }

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/artists");
    revalidatePath("/profile/edit");

    return {
      success: true,
      merged: totalMerged,
      message: `Successfully merged ${totalMerged} duplicate prop(s) into ${duplicates.length} canonical prop(s).`,
      details: mergeDetails,
    };
  } catch (error) {
    console.error("Error normalizing props:", error);
    return {
      success: false,
      error: "Failed to normalize props",
      merged: 0,
      details: [],
    };
  }
}

/**
 * Find duplicate props without merging them.
 * Useful for previewing what would be merged.
 * 
 * @returns Object with duplicate groups
 */
export async function findDuplicateProps() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to find duplicate props.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can find duplicate props.",
    };
  }

  try {
    // Helper function to normalize a prop name for comparison
    const normalizeName = (name: string): string => {
      return name.trim().toLowerCase().replace(/\s+/g, "");
    };

    // Get all props
    const allProps = await db
      .select({
        id: props.id,
        name: props.name,
      })
      .from(props)
      .orderBy(asc(props.name));

    // Group props by normalized name
    const propsByNormalized: Map<string, Array<{ id: number; name: string }>> = new Map();

    for (const prop of allProps) {
      const normalized = normalizeName(prop.name);
      if (!propsByNormalized.has(normalized)) {
        propsByNormalized.set(normalized, []);
      }
      propsByNormalized.get(normalized)!.push(prop);
    }

    // Find duplicates (groups with more than one prop)
    const duplicates: Array<{
      normalized: string;
      props: Array<{ id: number; name: string }>;
      suggestedCanonical: { id: number; name: string };
    }> = [];

    for (const [normalized, propGroup] of propsByNormalized.entries()) {
      if (propGroup.length > 1) {
        // Choose suggested canonical name: prefer one with spaces, otherwise the first alphabetically
        const suggestedCanonical = propGroup.reduce((best, current) => {
          const bestHasSpaces = best.name.includes(" ");
          const currentHasSpaces = current.name.includes(" ");
          
          if (currentHasSpaces && !bestHasSpaces) {
            return current;
          }
          if (bestHasSpaces && !currentHasSpaces) {
            return best;
          }
          // If both have spaces or neither has spaces, prefer alphabetically first
          return current.name.localeCompare(best.name) < 0 ? current : best;
        });

        duplicates.push({
          normalized,
          props: propGroup,
          suggestedCanonical,
        });
      }
    }

    return {
      success: true,
      duplicates,
      count: duplicates.length,
      totalDuplicateProps: duplicates.reduce((sum, d) => sum + d.props.length, 0),
    };
  } catch (error) {
    console.error("Error finding duplicate props:", error);
    return {
      success: false,
      error: "Failed to find duplicate props",
      duplicates: [],
      count: 0,
      totalDuplicateProps: 0,
    };
  }
}

/**
 * Create a new prop
 */
export async function createProp(formData: FormData) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to create props.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can create props.",
    };
  }

  const name = formData.get("name") as string;

  // Validate required fields
  if (!name || !name.trim()) {
    return { success: false, error: "Prop name is required" };
  }

  try {
    const newProp = await db
      .insert(props)
      .values({ name: name.trim() })
      .returning({ id: props.id, name: props.name });

    revalidatePath("/admin/props");
    revalidateTag("props-stats");
    return {
      success: true,
      prop: newProp[0],
    };
  } catch (error) {
    console.error("Error creating prop:", error);
    if (error instanceof Error && error.message.includes("unique")) {
      return {
        success: false,
        error: `A prop with the name "${name.trim()}" already exists.`,
      };
    }
    return {
      success: false,
      error: "Failed to create prop",
    };
  }
}

/**
 * Update an existing prop
 */
export async function updateProp(formData: FormData) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to update props.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can update props.",
    };
  }

  const idInput = formData.get("id") as string;
  const name = formData.get("name") as string;

  // Validate required fields
  if (!idInput || !name || !name.trim()) {
    return { success: false, error: "Prop ID and name are required" };
  }

  const id = parseInt(idInput, 10);
  if (isNaN(id)) {
    return { success: false, error: "Invalid prop ID" };
  }

  try {
    const updatedProp = await db
      .update(props)
      .set({ name: name.trim() })
      .where(eq(props.id, id))
      .returning({ id: props.id, name: props.name });

    if (updatedProp.length === 0) {
      return {
        success: false,
        error: "Prop not found",
      };
    }

    revalidatePath("/admin/props");
    revalidateTag("props-stats");
    return {
      success: true,
      prop: updatedProp[0],
    };
  } catch (error) {
    console.error("Error updating prop:", error);
    if (error instanceof Error && error.message.includes("unique")) {
      return {
        success: false,
        error: `A prop with the name "${name.trim()}" already exists.`,
      };
    }
    return {
      success: false,
      error: "Failed to update prop",
    };
  }
}

/**
 * Delete a prop
 */
export async function deleteProp(formData: FormData) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to delete props.",
    };
  }

  // Check authorization: must be admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    return {
      success: false,
      error: "Unauthorized. Only admins can delete props.",
    };
  }

  const idInput = formData.get("id") as string;

  if (!idInput) {
    return { success: false, error: "Prop ID is required" };
  }

  const id = parseInt(idInput, 10);
  if (isNaN(id)) {
    return { success: false, error: "Invalid prop ID" };
  }

  try {
    // Check if prop is referenced by events or user_props
    const eventsUsingProp = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events)
      .where(eq(events.propId, id));

    const userPropsUsingProp = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userProps)
      .where(eq(userProps.propId, id));

    const eventsCount = Number(eventsUsingProp[0]?.count || 0);
    const userPropsCount = Number(userPropsUsingProp[0]?.count || 0);

    if (eventsCount > 0 || userPropsCount > 0) {
      return {
        success: false,
        error: `Cannot delete prop. It is currently used by ${eventsCount} event(s) and ${userPropsCount} user prop(s).`,
      };
    }

    await db.delete(props).where(eq(props.id, id));

    revalidatePath("/admin/props");
    revalidateTag("props-stats");
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting prop:", error);
    return {
      success: false,
      error: "Failed to delete prop",
    };
  }
}
