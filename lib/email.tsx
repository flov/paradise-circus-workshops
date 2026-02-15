import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { AdminNotificationEmail } from "@/emails/admin-notification";
import { EventPendingApprovalEmail } from "@/emails/event-pending-approval";
import { EventApprovedEmail } from "@/emails/event-approved";
import { AdminEventPendingEmail } from "@/emails/admin-event-pending";
import { EventCommentNotificationEmail } from "@/emails/event-comment-notification";
import { EventCancelledEmail } from "@/emails/event-cancelled";
import { InstructorAssignedEmail } from "@/emails/instructor-assigned";
import { RecapAddedEmail } from "@/emails/recap-added";
import { AdminPromotedEmail } from "@/emails/admin-promoted";

type BookingConfirmationEmailProps = {
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string;
  participationId: number;
  confirmationToken: string;
  whatToBring?: string | null;
};

// Helper function to generate plain text version
const generatePlainText = (props: BookingConfirmationEmailProps) => {
  const {
    participantName,
    eventTitle,
    eventDate,
    eventStartTime,
    eventEndTime,
    eventLocation,
    instructorName,
    participationId,
    confirmationToken,
    whatToBring,
  } = props;

  // Format date
  const date = new Date(eventDate);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Build "What to Bring" list
  const whatToBringItems: string[] = [];
  if (whatToBring) {
    const customItems = whatToBring
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    whatToBringItems.push(...customItems);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";

  return `
Paradise Circus - Event Booking Confirmation

Dear ${participantName},

Thank you for booking an event with Paradise Circus! Your spot has been confirmed.

Event Details:
- Title: ${eventTitle}
- Date: ${formattedDate}
- Time: ${formatTime(eventStartTime)} - ${formatTime(eventEndTime)}
- Location: ${eventLocation}
- Instructor: ${instructorName}
${
  whatToBringItems.length > 0
    ? `
What to Bring:
${whatToBringItems.map((item) => `- ${item}`).join("\n")}
`
    : ""
}
Important Information:
- All equipment will be provided
- Contact us if you need to make any changes

View your participation details: ${appUrl}/booking-confirmation/${confirmationToken}

Cancel this participation: ${appUrl}/api/cancel-booking?id=${participationId}

We're excited to see you at the event!

Participation Reference: #${participationId}

The Paradise Circus Team
  `.trim();
};

export async function sendBookingConfirmationEmail(
  props: BookingConfirmationEmailProps,
) {
  const { participantEmail, eventTitle } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<BookingConfirmationEmail {...props} />);

  // Generate plain text version
  const emailText = generatePlainText(props);

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return {
      success: false,
      error: "Email service not configured",
      html: emailHtml,
      text: emailText,
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: participantEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Booking confirmation email sent to:", participantEmail);
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    throw error;
  }

  return {
    success: true,
    html: emailHtml,
    text: emailText,
  };
}

type AdminNotificationEmailProps = {
  participantName: string;
  participantEmail: string;
  participantPhone: string | null;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  participationId: number;
};

// Re-export types from email components for consistency
export type { AdminNotificationEmailProps as AdminNotificationEmailPropsType };

export async function sendAdminNotificationEmail(
  props: AdminNotificationEmailProps,
) {
  const { eventTitle } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<AdminNotificationEmail {...props} />);

  const adminEmail = process.env.ADMIN_EMAIL || "no-reply@paradisecircus.com";

  // Send admin notification email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error(
      "RESEND_API_KEY is not set. Admin notification will not be sent.",
    );
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Booking: ${eventTitle}`,
      html: emailHtml,
    });

    console.log("Admin notification email sent to:", adminEmail);
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
    throw error;
  }

  return { success: true };
}

type EventPendingApprovalEmailProps = {
  instructorName: string;
  instructorEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
};

export async function sendEventPendingApprovalEmail(
  props: EventPendingApprovalEmailProps,
) {
  const { instructorEmail, eventTitle } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<EventPendingApprovalEmail {...props} />);

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: instructorEmail,
      subject: `Workshop Submitted: ${eventTitle}`,
      html: emailHtml,
    });

    console.log("Event pending approval email sent to:", instructorEmail);
  } catch (error) {
    console.error("Failed to send event pending approval email:", error);
    throw error;
  }

  return { success: true };
}

type EventApprovedEmailProps = {
  instructorName: string;
  instructorEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventId: number;
};

export async function sendEventApprovedEmail(
  props: EventApprovedEmailProps,
) {
  const { instructorEmail, eventTitle } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<EventApprovedEmail {...props} />);

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: instructorEmail,
      subject: `Workshop Approved: ${eventTitle}`,
      html: emailHtml,
    });

    console.log("Event approved email sent to:", instructorEmail);
  } catch (error) {
    console.error("Failed to send event approved email:", error);
    throw error;
  }

  return { success: true };
}

type AdminEventPendingEmailProps = {
  instructorName: string;
  instructorEmail: string | null;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventId: number;
};

export async function sendAdminEventPendingEmail(
  props: AdminEventPendingEmailProps,
  adminEmail: string,
) {
  const { eventTitle } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<AdminEventPendingEmail {...props} />);

  // Send admin notification email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error(
      "RESEND_API_KEY is not set. Admin event pending notification will not be sent.",
    );
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New Workshop Pending Approval: ${eventTitle}`,
      html: emailHtml,
    });

    console.log("Admin event pending email sent to:", adminEmail);
  } catch (error) {
    console.error("Failed to send admin event pending email:", error);
    throw error;
  }

  return { success: true };
}

type EventCommentNotificationEmailProps = {
  recipientName: string;
  recipientEmail: string;
  authorName: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string | null;
  commentContent: string;
  eventUrl: string;
};

// Helper function to format date
function formatDateForComment(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to format time
function formatTimeForComment(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export async function sendCommentNotificationEmail(
  props: EventCommentNotificationEmailProps,
) {
  const { recipientEmail, recipientName, eventTitle, authorName } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<EventCommentNotificationEmail {...props} />);

  // Generate plain text version
  const formattedDate = formatDateForComment(props.eventDate);

  const emailText = `
Paradise Circus - New Message on Event

Dear ${recipientName},

${authorName} posted a new message on the event "${eventTitle}":

"${props.commentContent}"

Event Details:
- Title: ${eventTitle}
- Date: ${formattedDate}
- Time: ${formatTimeForComment(props.eventStartTime)} - ${formatTimeForComment(props.eventEndTime)}
- Location: ${props.eventLocation}
${props.instructorName ? `- Instructor: ${props.instructorName}` : ""}

View the event and reply: ${props.eventUrl}

Join the conversation and stay connected with other participants!

The Paradise Circus Team
  `.trim();

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `New Message: ${eventTitle}`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Comment notification email sent to:", recipientEmail);
  } catch (error) {
    console.error("Failed to send comment notification email:", error);
    throw error;
  }

  return { success: true };
}

type EventCancelledEmailProps = {
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string;
  cancellationMessage?: string | null;
};

// Helper function to format date for cancellation email
function formatDateForCancellation(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to format time for cancellation email
function formatTimeForCancellation(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export async function sendEventCancelledEmail(
  props: EventCancelledEmailProps,
) {
  const { participantEmail, participantName, eventTitle, eventDate, eventStartTime, eventEndTime, eventLocation, instructorName, cancellationMessage } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<EventCancelledEmail {...props} />);

  // Generate plain text version
  const formattedDate = formatDateForCancellation(eventDate);

  const emailText = `
Paradise Circus - Event Cancellation Notice

Dear ${participantName},

We regret to inform you that the following event has been cancelled:

Event Details:
- Title: ${eventTitle}
- Date: ${formattedDate}
- Time: ${formatTimeForCancellation(eventStartTime)} - ${formatTimeForCancellation(eventEndTime)}
- Location: ${eventLocation}
- Instructor: ${instructorName}
${cancellationMessage ? `
Message from the Instructor:
${cancellationMessage}
` : ""}
What happens next:
- Your booking has been automatically cancelled
- If you have any questions or concerns, please don't hesitate to reach out to us
- We apologize for any inconvenience this may cause

We hope to see you at future Paradise Circus events!

The Paradise Circus Team
  `.trim();

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: participantEmail,
      subject: `Event Cancelled: ${eventTitle}`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Event cancellation email sent to:", participantEmail);
  } catch (error) {
    console.error("Failed to send event cancellation email:", error);
    throw error;
  }

  return { success: true };
}

type InstructorAssignedEmailProps = {
  instructorName: string;
  instructorEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventSlug: string;
};

// Helper function to format date for instructor assignment email
function formatDateForInstructorAssignment(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to format time for instructor assignment email
function formatTimeForInstructorAssignment(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export async function sendInstructorAssignedEmail(
  props: InstructorAssignedEmailProps,
) {
  const { instructorEmail, instructorName, eventTitle, eventDate, eventStartTime, eventEndTime, eventLocation, eventSlug } = props;

  // Render React Email component to HTML
  const emailHtml = await render(
    <InstructorAssignedEmail
      instructorName={instructorName}
      eventTitle={eventTitle}
      eventDate={eventDate}
      eventStartTime={eventStartTime}
      eventEndTime={eventEndTime}
      eventLocation={eventLocation}
      eventSlug={eventSlug}
    />
  );

  // Generate plain text version
  const formattedDate = formatDateForInstructorAssignment(eventDate);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
  const editUrl = `${appUrl}/event/${eventSlug}/edit`;

  const emailText = `
Paradise Circus - Event Assignment

Dear ${instructorName},

You have been assigned as the instructor for the event/workshop "${eventTitle}".

Event Details:
- Title: ${eventTitle}
- Date: ${formattedDate}
- Time: ${formatTimeForInstructorAssignment(eventStartTime)} - ${formatTimeForInstructorAssignment(eventEndTime)}
- Location: ${eventLocation}

Your Rights & Responsibilities:
As the assigned instructor, you now have the rights to edit this event's description, time, and date.

Important: When changing the time or date, please be mindful that you don't take the spot of someone else. Always consult with the person who has the spot to see whether they are willing to share the space before making any changes.

Edit Event: ${editUrl}

Thank you for being part of the Paradise Circus community!

The Paradise Circus Team
  `.trim();

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: instructorEmail,
      subject: `You've Been Assigned: ${eventTitle}`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Instructor assignment email sent to:", instructorEmail);
  } catch (error) {
    console.error("Failed to send instructor assignment email:", error);
    throw error;
  }

  return { success: true };
}

type RecapAddedEmailProps = {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string | null;
  eventUrl: string;
  recapVideoId: string;
};

// Helper function to format date for recap email
function formatDateForRecap(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to format time for recap email
function formatTimeForRecap(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export async function sendRecapAddedEmail(props: RecapAddedEmailProps) {
  const { recipientEmail, recipientName, eventTitle, eventDate, eventStartTime, eventEndTime, eventLocation, instructorName, eventUrl, recapVideoId } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<RecapAddedEmail {...props} />);

  // Generate plain text version
  const formattedDate = formatDateForRecap(eventDate);

  const emailText = `
Paradise Circus - Workshop Recap Available

Dear ${recipientName},

A recap video has been added for the workshop "${eventTitle}".

Event Details:
- Title: ${eventTitle}
- Date: ${formattedDate}
- Time: ${formatTimeForRecap(eventStartTime)} - ${formatTimeForRecap(eventEndTime)}
- Location: ${eventLocation}
${instructorName ? `- Instructor: ${instructorName}` : ""}

Watch the recap video: ${eventUrl}

Relive the workshop experience and catch up on what you might have missed!

The Paradise Circus Team
  `.trim();

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Workshop Recap Available: ${eventTitle}`,
      html: emailHtml,
      text: emailText,
    });

    console.log("Recap notification email sent to:", recipientEmail);
  } catch (error) {
    console.error("Failed to send recap notification email:", error);
    throw error;
  }

  return { success: true };
}

type AdminPromotedEmailProps = {
  adminName: string;
  adminEmail: string;
};

export async function sendAdminPromotedEmail(
  props: AdminPromotedEmailProps,
) {
  const { adminEmail, adminName } = props;

  // Render React Email component to HTML
  const emailHtml = await render(<AdminPromotedEmail adminName={adminName} />);

  // Generate plain text version
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
  const timetableUrl = `${appUrl}/timetable`;
  const pendingApprovalUrl = `${appUrl}/admin/pending-approval`;

  const emailText = `
Paradise Circus - Welcome to the Admin Team!

Dear ${adminName},

Congratulations! You have been promoted to an admin role for the Paradise Circus workshop platform. We're excited to have you join our team and help manage our community's workshop timetable.

Your Role: Community Management
As an admin, your primary responsibility is community management of the workshop timetable. This means you play a crucial role in ensuring our platform runs smoothly and maintains high-quality workshops that align with our community values.

Your Key Responsibilities

1. Review Pending Workshops
From time to time, please check the timetable in an authenticated state to review workshops that have been submitted by instructors. When someone submits a workshop, you should:

• Review the content - Check that the workshop description, title, and details are suitable and coherent with Thai culture
• Check space availability - Verify whether the requested time slot is already taken by another workshop
• Approve or request changes - If everything looks good, approve the workshop. If there are issues, you can reach out to the instructor to discuss modifications

2. Manage Timetable Capacity
When the timetable is full and there's limited space available:

• Consider whether instructors who are giving many workshops should reduce their frequency to allow space for others
• Encourage sharing of time slots when appropriate
• Help maintain a balanced and diverse workshop schedule

3. Regular Monitoring
Make it a habit to check the pending approval page regularly to ensure workshops are reviewed in a timely manner. This helps instructors plan ahead and keeps the community engaged.

Review Pending Workshops: ${pendingApprovalUrl}
View Timetable: ${timetableUrl}

Important Notes

Cultural Sensitivity: When reviewing workshops, please ensure that the content is respectful and appropriate for the Thai cultural context. This includes checking language, imagery, and themes.

Fairness: Strive to maintain fairness in workshop approvals and space allocation. Consider the needs of both new and established instructors.

Communication: If you need to request changes or have questions about a workshop, reach out to the instructor directly through the platform or via their contact information.

Thank you for taking on this important role in our community. Your efforts help ensure that Paradise Circus continues to be a vibrant and welcoming space for circus arts in Thailand.

The Paradise Circus Team
  `.trim();

  // Send email via Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Email will not be sent.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: "Welcome to the Admin Team - Paradise Circus",
      html: emailHtml,
      text: emailText,
    });

    console.log("Admin promotion email sent to:", adminEmail);
  } catch (error) {
    console.error("Failed to send admin promotion email:", error);
    throw error;
  }

  return { success: true };
}
