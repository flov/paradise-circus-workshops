import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { AdminNotificationEmail } from "@/emails/admin-notification";
import { EventPendingApprovalEmail } from "@/emails/event-pending-approval";
import { EventApprovedEmail } from "@/emails/event-approved";
import { AdminEventPendingEmail } from "@/emails/admin-event-pending";

type BookingConfirmationEmailProps = {
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string;
  bookingId: number;
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
    bookingId,
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

View your booking details: ${appUrl}/booking-confirmation/${confirmationToken}

Cancel this booking: ${appUrl}/api/cancel-booking?id=${bookingId}

We're excited to see you at the event!

Booking Reference: #${bookingId}

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
  bookingId: number;
};

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
