ALTER TABLE "bookings" RENAME TO "participations";--> statement-breakpoint
ALTER TABLE "participations" RENAME COLUMN "booking_date" TO "participation_date";--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "bookings_confirmation_token_unique";--> statement-breakpoint
ALTER TABLE "participations" DROP CONSTRAINT "bookings_event_id_events_id_fk";
--> statement-breakpoint
DROP INDEX "idx_bookings_event_id";--> statement-breakpoint
DROP INDEX "idx_bookings_email";--> statement-breakpoint
DROP INDEX "idx_bookings_confirmation_token";--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_participations_event_id" ON "participations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_participations_email" ON "participations" USING btree ("participant_email");--> statement-breakpoint
CREATE INDEX "idx_participations_confirmation_token" ON "participations" USING btree ("confirmation_token");--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_confirmation_token_unique" UNIQUE("confirmation_token");