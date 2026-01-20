import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";
import * as React from "react";

export type EventCancelledEmailProps = {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string;
  cancellationMessage?: string | null;
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

export const EventCancelledEmail = ({
  participantName,
  eventTitle,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  instructorName,
  cancellationMessage,
}: EventCancelledEmailProps) => {
  const formattedDate = formatDate(eventDate);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎪 Paradise Circus</Heading>
            <Text style={headerSubtitle}>Event Cancellation Notice</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Dear {participantName},</Text>

            <Text style={text}>
              We regret to inform you that the following event has been cancelled:
            </Text>

            <Section style={workshopDetails}>
              <Heading style={eventTitleStyle}>{eventTitle}</Heading>
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
              <Section style={detailRow}>
                <Text style={detailLabel}>Instructor:</Text>
                <Text style={detailValue}>{instructorName}</Text>
              </Section>
            </Section>

            {cancellationMessage && (
              <Section style={infoBox}>
                <Heading style={infoBoxTitle}>Message from the Instructor:</Heading>
                <Text style={messageText}>{cancellationMessage}</Text>
              </Section>
            )}

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>What happens next:</Heading>
              <ul style={list}>
                <li style={listItem}>Your booking has been automatically cancelled</li>
                <li style={listItem}>
                  If you have any questions or concerns, please don't hesitate to reach out to us
                </li>
                <li style={listItem}>
                  We apologize for any inconvenience this may cause
                </li>
              </ul>
            </Section>

            <Text style={text}>
              We hope to see you at future Paradise Circus events!
            </Text>

            <Text style={signature}>
              <strong>The Paradise Circus Team</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Paradise Circus</Text>
            <Text style={footerSmall}>
              This is an automated notification email. Please do not reply to
              this message.
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
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  lineHeight: 1.6,
  color: "#333",
  margin: 0,
  padding: 0,
  backgroundColor: "#f9f9f9",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const header = {
  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  color: "#ffffff",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const headerTitle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
  color: "#ffffff",
};

const headerSubtitle = {
  margin: "8px 0 0 0",
  fontSize: "16px",
  color: "#ffffff",
};

const content = {
  padding: "32px 24px",
};

const text = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#333",
  margin: "0 0 16px 0",
};

const workshopDetails = {
  backgroundColor: "#fee2e2",
  borderLeft: "4px solid #dc2626",
  padding: "20px",
  margin: "24px 0",
  borderRadius: "4px",
};

const eventTitleStyle = {
  margin: "0 0 16px 0",
  fontSize: "20px",
  color: "#991b1b",
  fontWeight: 600,
};

const detailRow = {
  display: "flex",
  margin: "8px 0",
  fontSize: "14px",
};

const detailLabel = {
  fontWeight: 600,
  color: "#991b1b",
  minWidth: "120px",
  margin: 0,
};

const detailValue = {
  color: "#7f1d1d",
  margin: 0,
};

const infoBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const infoBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  color: "#374151",
  fontWeight: 600,
};

const messageText = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#374151",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const list = {
  margin: 0,
  paddingLeft: "20px",
  color: "#6b7280",
};

const listItem = {
  margin: "6px 0",
};

const signature = {
  marginTop: "24px",
  fontSize: "16px",
  color: "#333",
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

export default EventCancelledEmail;
