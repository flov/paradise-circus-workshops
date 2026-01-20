import EventCancelledEmail from "./event-cancelled";

export default function Preview() {
  return (
    <EventCancelledEmail
      participantName="John Doe"
      eventTitle="Introduction to Juggling"
      eventDate="2024-12-15"
      eventStartTime="14:00"
      eventEndTime="16:00"
      eventLocation="Main Studio"
      instructorName="Jane Smith"
      cancellationMessage="Unfortunately, we need to cancel this workshop due to unforeseen circumstances. We apologize for any inconvenience and hope to reschedule soon. Please keep an eye out for future workshops!"
    />
  );
}
