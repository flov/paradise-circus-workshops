/**
 * Calendar utility functions for generating iCalendar (.ics) files
 * Implements RFC 5545 specification
 */

type WorkshopCalendarData = {
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
  const domain = process.env.NEXT_PUBLIC_SITE_URL || "paradisecircus.com";
  return `workshop-${bookingId}-${date.replace(/-/g, "")}@${domain}`;
}

/**
 * Generates iCalendar (.ics) file content from workshop data
 */
export function generateICSFile(data: WorkshopCalendarData): string {
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
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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
  eventDescription += "\\n\\nBooking Reference: #" + bookingId;

  // Build iCalendar content
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paradise Circus//Workshop Booking//EN",
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
  lines.push(`ORGANIZER;CN=${escapeICS(instructor)}:mailto:${escapeICS(instructor.toLowerCase().replace(/\s+/g, "."))}@paradisecircus.com`);

  // Add URL to booking confirmation page
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://paradisecircus.com";
  lines.push(`URL:${siteUrl}/booking-confirmation/${confirmationToken}`);

  // Set status
  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

