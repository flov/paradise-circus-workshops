CREATE INDEX "idx_events_date_is_published" ON "events" USING btree ("date","is_published");--> statement-breakpoint
CREATE INDEX "idx_events_instructor_id" ON "events" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "idx_events_is_published" ON "events" USING btree ("is_published");