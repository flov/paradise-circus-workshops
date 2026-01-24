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

export type RecapAddedEmailProps = {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  instructorName: string | null;
  eventUrl: string;
  recapVideoId: string;
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

export const RecapAddedEmail = ({
  recipientName,
  eventTitle,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  instructorName,
  eventUrl,
  recapVideoId,
}: RecapAddedEmailProps) => {
  const formattedDate = formatDate(eventDate);
  const youtubeUrl = `https://www.youtube.com/watch?v=${recapVideoId}`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎬 Paradise Circus</Heading>
            <Text style={headerSubtitle}>Workshop Recap Available</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Dear {recipientName},</Text>

            <Text style={text}>
              A recap video has been added for the workshop "{eventTitle}".
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
              {instructorName && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Instructor:</Text>
                  <Text style={detailValue}>{instructorName}</Text>
                </Section>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Link href={eventUrl} style={button}>
                Watch Recap Video
              </Link>
            </Section>

            <Text style={text}>
              Relive the workshop experience and catch up on what you might have missed!
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
  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #d97706",
  padding: "20px",
  margin: "24px 0",
  borderRadius: "4px",
};

const eventTitleStyle = {
  margin: "0 0 16px 0",
  fontSize: "20px",
  color: "#92400e",
  fontWeight: 600,
};

const detailRow = {
  display: "flex",
  margin: "8px 0",
  fontSize: "14px",
};

const detailLabel = {
  fontWeight: 600,
  color: "#92400e",
  minWidth: "120px",
  margin: 0,
};

const detailValue = {
  color: "#451a03",
  margin: 0,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  display: "inline-block",
  margin: "24px 0",
  padding: "12px 24px",
  backgroundColor: "#8b5cf6",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
  textAlign: "center" as const,
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

export default RecapAddedEmail;
