import EventPendingApprovalEmail from "./event-pending-approval";

export default function Preview() {
  return (
    <EventPendingApprovalEmail
      instructorName="Jane Smith"
      eventTitle="Introduction to Acrobatics"
      eventDate="2024-12-25"
      eventStartTime="14:00"
      eventEndTime="16:00"
      eventLocation="Training Hall"
    />
  );
}
