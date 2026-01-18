import AdminNotificationEmail from "./admin-notification";

export default function Preview() {
  return (
    <AdminNotificationEmail
      participantName="John Doe"
      participantEmail="john.doe@example.com"
      participantPhone="+1 (555) 123-4567"
      eventTitle="Introduction to Juggling"
      eventDate="2024-12-15"
      eventStartTime="14:00"
      bookingId={12345}
    />
  );
}

