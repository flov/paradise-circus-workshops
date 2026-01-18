ALTER TABLE "events" ADD COLUMN "recurring_series_id" varchar(36);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_recurring_series_id" ON "events" USING btree ("recurring_series_id");