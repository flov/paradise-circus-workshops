import ParticipationConfirmationEmail from "./participation-confirmation";

export default function Preview() {
  return (
    <ParticipationConfirmationEmail
      participantName="John Doe"
      eventTitle="Introduction to Juggling"
      eventDate="2024-12-15"
      eventStartTime="14:00"
      eventEndTime="16:00"
      eventLocation="Main Studio"
      instructorName="Jane Smith"
      participationId={12345}
      confirmationToken="abc123def456"
      whatToBring="Comfortable clothes\nWater bottle\nPositive attitude"
    />
  );
}

