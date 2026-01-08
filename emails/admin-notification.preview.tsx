import AdminNotificationEmail from "./admin-notification";

export default function Preview() {
  return (
    <AdminNotificationEmail
      participantName="John Doe"
      participantEmail="john.doe@example.com"
      participantPhone="+1 (555) 123-4567"
      workshopTitle="Introduction to Juggling"
      workshopDate="2024-12-15"
      workshopStartTime="14:00"
      bookingId={12345}
    />
  );
}

