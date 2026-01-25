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

export type RecurringWorkshopInfoEmailProps = {
  instructorName: string;
};

export const RecurringWorkshopInfoEmail = ({
  instructorName,
}: RecurringWorkshopInfoEmailProps) => {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
  const usersUrl = `${appUrl}/admin/users`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎪 Paradise Circus</Heading>
            <Heading style={headerSubtitle}>
              Important Information About Recurring Workshops
            </Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hi {instructorName},</Text>

            <Text style={text}>
              Thank you for setting up your workshop as recurring! I wanted to
              share some important information about how recurring workshops
              work so you know what to expect.
            </Text>

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>How Recurring Workshops Work</Heading>
              <Text style={text}>
                When you mark a workshop as "recurring," our system
                automatically publishes it to future weeks on the calendar. Each
                week, the system copies your recurring workshop to the following
                week, ensuring it continues to appear on the schedule.
              </Text>
              <Text style={text}>
                <strong>Important:</strong> Once a workshop is marked as
                recurring, it will continue appearing on the calendar
                indefinitely—unless you or an admin manually removes the
                recurring status.
              </Text>
            </Section>

            <Section style={warningBox}>
              <Heading style={warningBoxTitle}>Your Responsibility</Heading>
              <Text style={text}>
                Since recurring workshops continue automatically, it's important
                to remember:
              </Text>
              <Text style={text}>
                • <strong>When you're leaving:</strong> If you're no longer able
                to teach your recurring workshop, please uncheck the "recurring"
                option on your workshop before you leave. This will prevent it
                from appearing on future calendars.
              </Text>
              <Text style={text}>
                • <strong>If you can't access your account:</strong> If you're
                unable to update your workshop yourself (for example, if you've
                already left or lost access), please notify an admin as soon as
                possible. You can find a list of admins in the{" "}
                <Link href={usersUrl} style={link}>
                  Users section
                </Link>{" "}
                of the platform.
              </Text>
            </Section>

            <Section style={helpBox}>
              <Heading style={helpBoxTitle}>Need Help?</Heading>
              <Text style={text}>
                If you have any questions about managing your recurring workshops
                or need assistance updating your workshop settings, please don't
                hesitate to reach out to an admin.
              </Text>
            </Section>

            <Text style={text}>
              Thank you for your understanding, and we appreciate you sharing
              your expertise with our community!
            </Text>

            <Text style={signature}>
              <strong>The Paradise Circus Team</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Paradise Circus</Text>
            <Text style={footerSmall}>
              This is an automated email. Please do not reply to this message.
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

const infoBox = {
  backgroundColor: "#ede9fe",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #8b5cf6",
};

const infoBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "18px",
  color: "#5b21b6",
  fontWeight: 600,
};

const warningBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #f59e0b",
};

const warningBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "18px",
  color: "#92400e",
  fontWeight: 600,
};

const helpBox = {
  backgroundColor: "#dbeafe",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #3b82f6",
};

const helpBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "18px",
  color: "#1e40af",
  fontWeight: 600,
};

const link = {
  color: "#3b82f6",
  textDecoration: "underline",
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

export default RecurringWorkshopInfoEmail;
