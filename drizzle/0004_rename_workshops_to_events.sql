-- Rename workshops table to events
ALTER TABLE "workshops" RENAME TO "events";

-- Rename workshop_id column to event_id in bookings table
ALTER TABLE "bookings" RENAME COLUMN "workshop_id" TO "event_id";

-- Drop old indexes
DROP INDEX IF EXISTS "idx_workshops_date";
DROP INDEX IF EXISTS "idx_bookings_workshop_id";

-- Create new indexes
CREATE INDEX IF NOT EXISTS "idx_events_date" ON "events"("date");
CREATE INDEX IF NOT EXISTS "idx_bookings_event_id" ON "bookings"("event_id");
