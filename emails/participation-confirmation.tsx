import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Img,
} from "@react-email/components";
import * as React from "react";

export type ParticipationConfirmationEmailProps = {
  participantName: string;
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

export const ParticipationConfirmationEmail = ({
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
}: ParticipationConfirmationEmailProps) => {
  const formattedDate = formatDate(eventDate);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";

  // Build "What to Bring" list
  const whatToBringItems: string[] = [];
  if (whatToBring) {
    const customItems = whatToBring
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    whatToBringItems.push(...customItems);
  }

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎪 Paradise Circus</Heading>
            <Text style={headerSubtitle}>Event Participation Confirmation</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Dear {participantName},</Text>

            <Text style={text}>
              Thank you for signing up to participate in a Paradise Circus event! Your spot has
              been confirmed.
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

            {whatToBringItems.length > 0 && (
              <Section style={infoBox}>
                <Heading style={infoBoxTitle}>What to Bring:</Heading>
                <ul style={list}>
                  {whatToBringItems.map((item, index) => (
                    <li key={index} style={listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>Important Information:</Heading>
              <ul style={list}>
                <li style={listItem}>All equipment will be provided</li>
                <li style={listItem}>
                  Contact us if you need to make any changes
                </li>
              </ul>
            </Section>

            <Section style={buttonContainer}>
              <Link
                href={`${appUrl}/participation-confirmation/${confirmationToken}`}
                style={button}
              >
                View Participation Details
              </Link>
            </Section>

            <Section style={cancelLinkContainer}>
              <Link
                href={`${appUrl}/api/cancel-participation?id=${participationId}`}
                style={cancelLink}
              >
                Cancel this participation
              </Link>
            </Section>

            <Text style={text}>
              We're excited to see you at the event! If you have any questions
              or need to make changes to your participation, please don't hesitate to
              reach out.
            </Text>

            <Text style={text}>See you under the big top!</Text>

            <Text style={signature}>
              <strong>The Paradise Circus Team</strong>
            </Text>

            <Text style={bookingNumber}>Participation Reference: #{participationId}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Paradise Circus</Text>
            <Text style={footerSmall}>
              This is an automated confirmation email. Please do not reply to
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
  background: "linear-gradient(135deg, #d97706 0%, #dc2626 100%)",
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

const list = {
  margin: 0,
  paddingLeft: "20px",
  color: "#6b7280",
};

const listItem = {
  margin: "6px 0",
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

const cancelLinkContainer = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const cancelLink = {
  color: "#dc2626",
  textDecoration: "underline",
  fontSize: "14px",
};

const signature = {
  marginTop: "24px",
  fontSize: "16px",
  color: "#333",
};

const bookingNumber = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "8px",
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

export default ParticipationConfirmationEmail;
