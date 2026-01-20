import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";

export type AdminNotificationEmailProps = {
  participantName: string;
  participantEmail: string;
  participantPhone: string | null;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  participationId: number;
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

export const AdminNotificationEmail = ({
  participantName,
  participantEmail,
  participantPhone,
  eventTitle,
  eventDate,
  eventStartTime,
  participationId,
}: AdminNotificationEmailProps) => {
  const formattedDate = formatDate(eventDate);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🔔 New Event Participation Received</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              A new participation has been made for <strong>{eventTitle}</strong>.
            </Text>

            <Section style={bookingInfo}>
              <Section style={infoRow}>
                <Text style={label}>Participant:</Text>
                <Text style={value}>{participantName}</Text>
              </Section>
              <Section style={infoRow}>
                <Text style={label}>Email:</Text>
                <Text style={value}>{participantEmail}</Text>
              </Section>
              {participantPhone && (
                <Section style={infoRow}>
                  <Text style={label}>Phone:</Text>
                  <Text style={value}>{participantPhone}</Text>
                </Section>
              )}
              <Section style={infoRow}>
                <Text style={label}>Event Date:</Text>
                <Text style={value}>
                  {formattedDate} at {formatTime(eventStartTime)}
                </Text>
              </Section>
              <Section style={infoRow}>
                <Text style={label}>Participation ID:</Text>
                <Text style={value}>#{participationId}</Text>
              </Section>
            </Section>

            <Text style={footerNote}>
              View and manage this participation in your admin dashboard.
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

const bookingInfo = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const infoRow = {
  display: "flex",
  margin: "8px 0",
  fontSize: "14px",
};

const label = {
  fontWeight: 600,
  color: "#374151",
  margin: 0,
  marginRight: "8px",
};

const value = {
  color: "#6b7280",
  margin: 0,
};

const footerNote = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "16px 0 0 0",
};

export default AdminNotificationEmail;

