import InstructorAssignedEmail from "./instructor-assigned";

export default function Preview() {
  return (
    <InstructorAssignedEmail
      instructorName="Jane Smith"
      eventTitle="Advanced Juggling Techniques"
      eventDate="2024-12-20"
      eventStartTime="15:00"
      eventEndTime="17:00"
      eventLocation="Main Studio"
      eventSlug="123-advanced-juggling-techniques-jane-smith"
    />
  );
};
