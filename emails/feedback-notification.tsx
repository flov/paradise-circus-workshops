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

export type FeedbackNotificationEmailProps = {
  name?: string;
  email?: string;
  message: string;
};

export const FeedbackNotificationEmail = ({
  name,
  email,
  message,
}: FeedbackNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>New Feedback Received</Heading>
          </Section>

          <Section style={content}>
            <Section style={infoBox}>
              <Text style={label}>From:</Text>
              <Text style={value}>{name || "Anonymous"}{email ? ` <${email}>` : ""}</Text>
            </Section>

            <Section style={infoBox}>
              <Text style={label}>Message:</Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.6,
  color: "#333",
  backgroundColor: "#f9f9f9",
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

const infoBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "16px",
  margin: "0 0 16px 0",
};

const label = {
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 4px 0",
  fontSize: "14px",
};

const value = {
  color: "#6b7280",
  margin: 0,
  fontSize: "14px",
};

const messageText = {
  color: "#333",
  margin: 0,
  fontSize: "15px",
  whiteSpace: "pre-wrap" as const,
};

export default FeedbackNotificationEmail;
