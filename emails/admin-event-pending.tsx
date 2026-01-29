import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from "@react-email/components";
import * as React from "react";

export type AdminEventPendingEmailProps = {
  instructorName: string;
  instructorEmail: string | null;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  eventId: number;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to format time
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const AdminEventPendingEmail = ({
  instructorName,
  instructorEmail,
  eventTitle,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  eventId,
}: AdminEventPendingEmailProps) => {
  const formattedDate = formatDate(eventDate);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🔔 New Workshop Pending Approval</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              A new workshop has been submitted by an instructor and requires your approval.
            </Text>

            <Section style={workshopDetails}>
              <Heading style={eventTitleStyle}>{eventTitle}</Heading>
              <Section style={detailRow}>
                <Text style={detailLabel}>Instructor:</Text>
                <Text style={detailValue}>{instructorName}</Text>
              </Section>
              {instructorEmail && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Instructor Email:</Text>
                  <Text style={detailValue}>{instructorEmail}</Text>
                </Section>
              )}
              <Section style={detailRow}>
                <Text style={detailLabel}>Date:</Text>
                <Text style={detailValue}>{formattedDate}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Time:</Text>
                <Text style={detailValue}>
                  {formatTime(eventStartTime)} - {formatTime(eventEndTime)}
                </Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Location:</Text>
                <Text style={detailValue}>{eventLocation}</Text>
              </Section>
            </Section>

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>Action Required</Heading>
              <Text style={text}>
                Please review this workshop by looking quickly at the timetable
                and check the details of the workshop. If everything looks good,
                approve it to make it visible to participants.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Link
                href={`${appUrl}/timetable`}
                style={button}
              >
                Review in timetable. Authenticate to see the admin timetable.
              </Link>
              <Link href={`${appUrl}/event/${eventId}`} style={button}>
                View Workshop Details
              </Link>
            </Section>

            <Text style={footerNote}>
              Event ID: #{eventId}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Paradise Circus Admin</Text>
            <Text style={footerSmall}>
              This is an automated notification. Please do not reply to this message.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.6,
  color: "#333",
  backgroundColor: "#f9f9f9",
  margin: 0,
  padding: 0,
};

const container = {
  maxWidth: "600px",
  margin: "20px auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const header = {
  backgroundColor: "#374151",
  color: "#ffffff",
  padding: "24px",
  borderRadius: "8px 8px 0 0",
};

const headerTitle = {
  margin: 0,
  fontSize: "20px",
  color: "#ffffff",
  fontWeight: 600,
};

const content = {
  padding: "24px",
};

const text = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#333",
  margin: "0 0 16px 0",
};

const workshopDetails = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const eventTitleStyle = {
  margin: "0 0 16px 0",
  fontSize: "20px",
  color: "#374151",
  fontWeight: 600,
};

const detailRow = {
  display: "flex",
  margin: "8px 0",
  fontSize: "14px",
};

const detailLabel = {
  fontWeight: 600,
  color: "#374151",
  minWidth: "140px",
  margin: 0,
  marginRight: "8px",
};

const detailValue = {
  color: "#6b7280",
  margin: 0,
};

const infoBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const infoBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  color: "#374151",
  fontWeight: 600,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  display: "inline-block",
  margin: "24px 0",
  padding: "12px 24px",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
  textAlign: "center" as const,
};

const footerNote = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "16px 0 0 0",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "24px",
  textAlign: "center" as const,
  color: "#6b7280",
  fontSize: "14px",
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  margin: 0,
  color: "#6b7280",
};

const footerSmall = {
  margin: "8px 0 0 0",
  fontSize: "12px",
  color: "#6b7280",
};

export default AdminEventPendingEmail;
