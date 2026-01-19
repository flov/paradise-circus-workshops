import EventCommentNotificationEmail from "./event-comment-notification";

export default function Preview() {
  return (
    <EventCommentNotificationEmail
      recipientName="Jane Smith"
      authorName="John Doe"
      eventTitle="Introduction to Juggling"
      eventDate="2024-12-15"
      eventStartTime="14:00"
      eventEndTime="16:00"
      eventLocation="Main Studio"
      instructorName="Jane Smith"
      commentContent="Hey everyone! I'm really excited about this workshop. Can't wait to learn some new tricks!"
      eventUrl="https://paradise-circus.app/event/introduction-to-juggling"
    />
  );
}
