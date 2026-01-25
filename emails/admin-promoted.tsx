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

export type AdminPromotedEmailProps = {
  adminName: string;
};

export const AdminPromotedEmail = ({ adminName }: AdminPromotedEmailProps) => {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://paradise-circus.app";
  const timetableUrl = `${appUrl}/timetable`;
  const pendingApprovalUrl = `${appUrl}/admin/pending-approval`;
  const adminUrl = `${appUrl}/admin`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎪 Paradise Circus</Heading>
            <Heading style={headerSubtitle}>Welcome to the Admin Team!</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Dear {adminName},</Text>

            <Text style={text}>
              Congratulations! You have been promoted to an admin role for the
              Paradise Circus workshop platform. We're excited to have you join
              our team and help manage our community's workshop timetable.
            </Text>

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>
                Your Role: Workshop Timetable Management
              </Heading>
              <Text style={text}>
                As an admin, your primary responsibility is{" "}
                <strong>management of the workshop timetable</strong>. The main
                task would be having an eye on the pending approvals displayed
                in the workshop timetable.
              </Text>
            </Section>

            <Section style={responsibilitiesBox}>
              <Heading style={responsibilitiesTitle}>
                Your Key Responsibilities
              </Heading>

              <Text style={text}>
                <strong>1. Review Pending Workshops</strong>
              </Text>
              <Text style={text}>
                From time to time, please check the timetable in an
                authenticated state to review workshops that have been submitted
                by instructors. When someone submits a workshop, you should:
              </Text>
              <Text style={listItem}>
                • <strong>Review the content</strong> - Check that the workshop
                description, title, and details are suitable and coherent with
                Thai culture
              </Text>
              <Text style={listItem}>
                • <strong>Check space availability</strong> - Verify whether the
                requested time slot is already taken by another workshop
              </Text>
              <Text style={listItem}>
                • <strong>Approve or request changes</strong> - If everything
                looks good, approve the workshop. If there are issues, you can
                reach out to the instructor to discuss modifications
              </Text>

              <Text style={text}>
                <strong>2. Manage Timetable Capacity</strong>
              </Text>
              <Text style={text}>
                When the timetable is full and there's limited space available:
              </Text>
              <Text style={listItem}>
                • Consider whether instructors who are giving many workshops
                should reduce their frequency to allow space for others
              </Text>
              <Text style={listItem}>
                • Encourage sharing of time slots when appropriate
              </Text>
              <Text style={listItem}>
                • Help maintain a balanced and diverse workshop schedule
              </Text>

              <Text style={text}>
                <strong>3. Regular Monitoring</strong>
              </Text>
              <Text style={text}>
                Make it a habit to check the pending approval page regularly to
                ensure workshops are reviewed in a timely manner. This helps
                instructors plan ahead and keeps the community engaged.
              </Text>

              <Text style={text}>
                <strong>4. Edit and Delete Events</strong>
              </Text>
              <Text style={text}>
                As an admin, you have full control over events in the weekly
                timetable view. You can edit and delete every event directly
                from the timetable by clicking on any event card. This allows
                you to make quick adjustments, correct errors, or remove
                workshops that are no longer relevant.
              </Text>

              <Text style={text}>
                <strong>5. Promote Other Admins</strong>
              </Text>
              <Text style={text}>
                If you find someone who wants to take over the role of an admin,
                you can promote them through the admin interface. Navigate to{" "}
                <strong>/admin</strong> and access the Users section to promote
                other users as admins. This helps ensure continuity and shared
                responsibility for managing the platform.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Link href={pendingApprovalUrl} style={button}>
                Review Pending Workshops
              </Link>
            </Section>

            <Section style={buttonContainer}>
              <Link href={timetableUrl} style={secondaryButton}>
                View Timetable
              </Link>
            </Section>

            <Section style={buttonContainer}>
              <Link href={adminUrl} style={secondaryButton}>
                Access Admin Interface
              </Link>
            </Section>

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>
                Understanding the Timetable View
              </Heading>
              <Text style={text}>
                The timetable view includes visual indicators to help you
                understand event status:
              </Text>
              <Text style={listItem}>
                • <strong>Repeat Icon (🔄)</strong> - Workshops that are set to
                recurring are marked with a repeat icon. These workshops
                automatically appear on future weeks' calendars.
              </Text>
              <Text style={listItem}>
                • <strong>Dashed Border</strong> - Workshops that don't have an
                instructor from the database assigned to them are marked with a
                dashed border. This helps identify workshops that may need an
                instructor assignment.
              </Text>
              <Text style={text}>
                These visual indicators are only visible to admins and help you
                quickly identify which workshops need attention.
              </Text>
            </Section>

            <Section style={infoBox}>
              <Heading style={infoBoxTitle}>Important Notes</Heading>
              <Text style={text}>
                <strong>Cultural Sensitivity:</strong> When reviewing workshops,
                please ensure that the content is respectful and appropriate for
                the Thai cultural context. This includes checking language,
                imagery, and themes.
              </Text>
              <Text style={text}>
                <strong>Fairness:</strong> Strive to maintain fairness in
                workshop approvals and space allocation. Consider the needs of
                both new and established instructors.
              </Text>
              <Text style={text}>
                <strong>Communication:</strong> If you need to request changes
                or have questions about a workshop, reach out to the instructor
                directly through the platform or via their contact information.
              </Text>
            </Section>

            <Text style={text}>
              Thank you for taking on this important role in our community. Your
              efforts help ensure that Paradise Circus continues to be a vibrant
              and welcoming space for circus arts in Thailand.
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
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #f59e0b",
};

const infoBoxTitle = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  color: "#92400e",
  fontWeight: 600,
};

const responsibilitiesBox = {
  backgroundColor: "#ede9fe",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
  borderLeft: "4px solid #8b5cf6",
};

const responsibilitiesTitle = {
  margin: "0 0 16px 0",
  fontSize: "18px",
  color: "#5b21b6",
  fontWeight: 600,
};

const listItem = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#4c1d95",
  margin: "0 0 8px 0",
  paddingLeft: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const button = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: "#8b5cf6",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
  textAlign: "center" as const,
};

const secondaryButton = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: "#ffffff",
  color: "#8b5cf6",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
  textAlign: "center" as const,
  border: "2px solid #8b5cf6",
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

export default AdminPromotedEmail;
