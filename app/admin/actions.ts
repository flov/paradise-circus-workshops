"use server";

import { db } from "@/db";
import { events, participations, props, users } from "@/db/schema";
import { eq, sql, inArray, asc, desc, isNotNull, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
      const currentUserResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (currentUserResult.length === 0) {
        return { success: false, error: "User record not found" };
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserResult[0].id;

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

    // Handle recurring events
    if (isRecurring) {
      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID();

      const startDate = new Date(date);
      const eventDates: string[] = [];

      // Create only 1 week ahead (initial event + next week = 2 events total)
      // Events will be automatically extended weekly
      eventDates.push(startDate.toISOString().split("T")[0]);
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      eventDates.push(nextWeekDate.toISOString().split("T")[0]);

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
      }));

      const newEvents = await db
        .insert(events)
        .values(eventValues)
        .returning({ id: events.id });

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
                console.log(
                  `Instructor assignment email sent to: ${instructorEmail}`,
                );
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
                console.log(
                  `Pending approval email sent to instructor: ${instructorEmail}`,
                );
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
              console.log(
                `Instructor assignment email sent to: ${instructorEmail}`,
              );
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
              console.log(
                `Pending approval email sent to instructor: ${instructorEmail}`,
              );
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

    // Update event to published
    await db
      .update(events)
      .set({ isPublished: true, updatedAt: sql`CURRENT_TIMESTAMP` })
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
              console.log(
                `Approval email sent to instructor: ${instructorEmail}`,
              );
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
    } else {
      console.log(
        `Skipping approval email: event ${eventId} has no instructorId`,
      );
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
  const isBeingPublished = isPublished && !wasPublished && userIsAdmin;
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
      const currentUserResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (currentUserResult.length === 0) {
        return { success: false, error: "User record not found" };
      }

      // Force instructorId to be the current user's id
      instructorId = currentUserResult[0].id;

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
      isPublished?: boolean;
      isRecurring?: boolean;
      recurringSeriesId?: string | null;
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
    };

    // Only update isPublished if user is admin
    if (userIsAdmin) {
      updateData.isPublished = isPublished;
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

      // Ensure title and instructorName are not null before creating slug
      if (title && instructorName) {
        revalidatePath(
          `/event/${createEventSlug(eventId, title, instructorName)}`,
        );
      }

      return { success: true };
    }

    // Handle converting non-recurring event to recurring (admins and instructors)
    if (!isRecurringEvent && isRecurring) {
      // Generate UUID for recurring series
      const recurringSeriesId = randomUUID();

      const startDate = new Date(date);
      const eventDates: string[] = [];

      // Create only 1 week ahead (initial event + next week = 2 events total)
      // Events will be automatically extended weekly
      eventDates.push(startDate.toISOString().split("T")[0]);
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      eventDates.push(nextWeekDate.toISOString().split("T")[0]);

      if (eventDates.length === 0) {
        return {
          success: false,
          error: "No valid dates found for recurring event.",
        };
      }

      // Update the current event to be part of the recurring series
      await db
        .update(events)
        .set({
          ...updateData,
          recurringSeriesId,
          isRecurring: true,
        })
        .where(eq(events.id, eventId));

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
        }));

        await db.insert(events).values(additionalEventValues);
      }

      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/api/timetable");

      return { success: true };
    }

    // Handle recurring events - update all events in the series (admin only)
    // Instructors can only update single events in a recurring series
    if (isRecurringEvent && userIsAdmin && currentEvent.recurringSeriesId) {
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

          // Update all events in the series with new dates
          for (const seriesEvent of seriesEvents) {
            const originalDate = new Date(seriesEvent.date);
            const newDate = new Date(originalDate);
            newDate.setDate(newDate.getDate() + dateDiff);
            const newDateStr = newDate.toISOString().split("T")[0];

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
        // Start date didn't change, just update all events in the series with the same data
        await db
          .update(events)
          .set(updateData)
          .where(eq(events.recurringSeriesId, currentEvent.recurringSeriesId));
      }
    } else {
      // Non-recurring event or non-admin updating - update single event
      await db.update(events).set(updateData).where(eq(events.id, eventId));
    }

    // Send instructor assignment email if admin assigned/changed instructorId
    const oldInstructorId = currentEvent.instructorId;
    const instructorIdChanged =
      oldInstructorId !== instructorId && instructorId !== null;
    if (userIsAdmin && instructorIdChanged) {
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
              console.log(
                `Instructor assignment email sent to: ${instructorEmail}`,
              );
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
              console.log(
                `Approval email sent to instructor: ${instructorEmail}`,
              );
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

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");
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
 * Extends recurring events to ensure there's always at least 1 week of future events.
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7); // 1 week ahead

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
      const latestEventDate = new Date(latestEvent.date);
      latestEventDate.setHours(0, 0, 0, 0);

      // Check if we need to extend (latest event date is before target date)
      if (latestEventDate < targetDate) {
        // Get all existing dates in the series to avoid duplicates
        const existingDates = new Set(seriesEvents.map((e) => e.date));

        // Create events until at least 1 week ahead is covered
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
        }> = [];

        let currentDate = new Date(latestEventDate);
        currentDate.setDate(currentDate.getDate() + 7); // Start from next week

        // Create events until we're at least 1 week ahead
        while (currentDate <= targetDate) {
          const dateStr = currentDate.toISOString().split("T")[0];

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
            });
          }

          currentDate.setDate(currentDate.getDate() + 7);
        }

        // Insert new events if any
        if (eventsToCreate.length > 0) {
          await db.insert(events).values(eventsToCreate);
          totalEventsCreated += eventsToCreate.length;
          console.log(
            `Extended recurring series ${series.recurringSeriesId}: created ${eventsToCreate.length} event(s)`,
          );
        }
      }
    }

    // Revalidate paths
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/timetable");

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

    return { success: true };
  } catch (error) {
    console.error("Error updating recap video:", error);
    return { success: false, error: "Failed to update recap video" };
  }
}
