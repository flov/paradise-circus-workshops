ALTER TABLE "events" ADD COLUMN "last_updated_by" integer;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
