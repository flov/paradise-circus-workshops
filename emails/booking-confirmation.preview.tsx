import BookingConfirmationEmail from "./booking-confirmation";

export default function Preview() {
  return (
    <BookingConfirmationEmail
      participantName="John Doe"
      workshopTitle="Introduction to Juggling"
      workshopDate="2024-12-15"
      workshopStartTime="14:00"
      workshopEndTime="16:00"
      workshopLocation="Main Studio"
      instructorName="Jane Smith"
      bookingId={12345}
      confirmationToken="abc123def456"
      whatToBring="Comfortable clothes\nWater bottle\nPositive attitude"
    />
  );
}

