/**
 * Calendar utility functions for generating iCalendar (.ics) files
 * Implements RFC 5545 specification
 */

export type EventCalendarData = {
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // Time string (HH:MM:SS or HH:MM)
  endTime: string; // Time string (HH:MM:SS or HH:MM)
  location?: string | null;
  instructor: string;
  description?: string | null;
  whatToBring?: string | null;
  bookingId: number;
  confirmationToken: string;
};

/**
 * Escapes special characters in iCalendar text fields
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Formats a date and time string into iCalendar format (YYYYMMDDTHHmmss)
 * Uses floating time (no timezone) - calendar apps will interpret in user's local timezone
 */
function formatICSDateTime(dateStr: string, timeStr: string): string {
  // Parse date (YYYY-MM-DD) - already in correct format, just remove dashes
  const datePart = dateStr.replace(/-/g, "");

  // Parse time (HH:MM:SS or HH:MM) and pad to HHMMSS
  const timeParts = timeStr.split(":");
  const hours = timeParts[0].padStart(2, "0");
  const minutes = timeParts[1].padStart(2, "0");
  const seconds = (timeParts[2] || "00").padStart(2, "0");

  // Format as YYYYMMDDTHHmmss (floating time, no timezone)
  return `${datePart}T${hours}${minutes}${seconds}`;
}

/**
 * Generates a unique UID for the calendar event
 */
function generateUID(bookingId: number, date: string): string {
  const domain = process.env.NEXT_PUBLIC_SITE_URL || "paradise-circus.app";
  return `event-${bookingId}-${date.replace(/-/g, "")}@${domain}`;
}

/**
 * Generates iCalendar (.ics) file content from event data
 */
export function generateICSFile(data: EventCalendarData): string {
  const {
    title,
    date,
    startTime,
    endTime,
    location,
    instructor,
    description,
    whatToBring,
    bookingId,
    confirmationToken,
  } = data;

  // Format dates/times
  const dtStart = formatICSDateTime(date, startTime);
  const dtEnd = formatICSDateTime(date, endTime);
  const dtStamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = generateUID(bookingId, date);

  // Build description
  let eventDescription = "";
  if (description) {
    eventDescription += description + "\\n\\n";
  }
  eventDescription += `Instructor: ${instructor}`;
  if (whatToBring) {
    eventDescription += "\\n\\nWhat to Bring:\\n";
    const items = whatToBring
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    eventDescription += items.map((item) => `- ${item}`).join("\\n");
  }

  // Build iCalendar content
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paradise Circus//Event Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }

  if (eventDescription) {
    lines.push(`DESCRIPTION:${escapeICS(eventDescription)}`);
  }

  // Add organizer (instructor)
  lines.push(
    `ORGANIZER;CN=${escapeICS(instructor)}:mailto:${escapeICS(instructor.toLowerCase().replace(/\s+/g, "."))}@paradisecircus.com`,
  );

  // Add URL - use event page if confirmationToken starts with "event-", otherwise use booking confirmation
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://paradise-circus.app";
  if (confirmationToken.startsWith("event-")) {
    // Extract event slug from token format "event-{slug}"
    const eventSlug = confirmationToken.replace("event-", "");
    lines.push(`URL:${siteUrl}/event/${eventSlug}`);
  } else {
    lines.push(`URL:${siteUrl}/booking-confirmation/${confirmationToken}`);
  }

  // Set status
  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Formats a date and time string into Google Calendar format (YYYYMMDDTHHmmss)
 * Uses floating time (no timezone) - Google Calendar will interpret in user's local timezone
 * This matches the ICS format approach since we don't have timezone information
 */
function formatGoogleCalendarDateTime(
  dateStr: string,
  timeStr: string,
): string {
  // Parse date (YYYY-MM-DD) - already in correct format, just remove dashes
  const datePart = dateStr.replace(/-/g, "");

  // Parse time (HH:MM:SS or HH:MM) and pad to HHMMSS
  const timeParts = timeStr.split(":");
  const hours = timeParts[0].padStart(2, "0");
  const minutes = timeParts[1].padStart(2, "0");
  const seconds = (timeParts[2] || "00").padStart(2, "0");

  // Format as YYYYMMDDTHHmmss (floating time, no timezone)
  return `${datePart}T${hours}${minutes}${seconds}`;
}

/**
 * Generates a Google Calendar URL with pre-filled event details
 * Opens Google Calendar in a new tab with the event form prepopulated
 */
export function generateGoogleCalendarURL(data: EventCalendarData): string {
  const {
    title,
    date,
    startTime,
    endTime,
    location,
    instructor,
    description,
    whatToBring,
    bookingId,
    confirmationToken,
  } = data;

  // Format dates/times in UTC
  const startDateTime = formatGoogleCalendarDateTime(date, startTime);
  const endDateTime = formatGoogleCalendarDateTime(date, endTime);

  // Build description similar to ICS format
  let eventDescription = "";
  if (description) {
    eventDescription += description + "\n\n";
  }
  eventDescription += `Instructor: ${instructor}`;
  if (whatToBring) {
    eventDescription += "\n\nWhat to Bring:\n";
    const items = whatToBring
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    eventDescription += items.map((item) => `- ${item}`).join("\n");
  }

  // Add URL - use event page if confirmationToken starts with "event-", otherwise use booking confirmation
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://paradise-circus.app";
  if (confirmationToken.startsWith("event-")) {
    // Extract event slug from token format "event-{slug}"
    const eventSlug = confirmationToken.replace("event-", "");
    eventDescription += `\n\nView event: ${siteUrl}/event/${eventSlug}`;
  } else {
    eventDescription += `\n\nView booking: ${siteUrl}/booking-confirmation/${confirmationToken}`;
  }

  // Build Google Calendar URL with URL-encoded parameters
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDateTime}/${endDateTime}`,
    details: eventDescription,
  });

  params.append("location", "Paradise Pai");

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
