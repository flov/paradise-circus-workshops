import RecapAddedEmail from "./recap-added";

export default function Preview() {
  return (
    <RecapAddedEmail
      recipientName="Jane Smith"
      eventTitle="Introduction to Juggling"
      eventDate="2024-12-15"
      eventStartTime="14:00"
      eventEndTime="16:00"
      eventLocation="Main Studio"
      instructorName="John Doe"
      eventUrl="https://paradise-circus.app/event/123-introduction-to-juggling-john-doe"
      recapVideoId="dQw4w9WgXcQ"
    />
  );
}
