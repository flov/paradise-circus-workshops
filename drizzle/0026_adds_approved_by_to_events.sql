ALTER TABLE "events" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
