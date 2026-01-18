import EventApprovedEmail from "./event-approved";

export default function Preview() {
  return (
    <EventApprovedEmail
      instructorName="Jane Smith"
      eventTitle="Advanced Juggling Techniques"
      eventDate="2024-12-20"
      eventStartTime="15:00"
      eventEndTime="17:00"
      eventLocation="Main Studio"
      eventId={123}
    />
  );
}
