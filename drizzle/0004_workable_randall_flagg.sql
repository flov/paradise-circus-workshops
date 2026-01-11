ALTER TABLE "workshops" RENAME TO "events";--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "workshop_id" TO "event_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_workshop_id_workshops_id_fk";
--> statement-breakpoint
DROP INDEX "idx_bookings_workshop_id";--> statement-breakpoint
DROP INDEX "idx_workshops_date";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookings_event_id" ON "bookings" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("date");