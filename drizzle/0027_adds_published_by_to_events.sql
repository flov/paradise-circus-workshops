ALTER TABLE "events" ADD COLUMN "published_by" integer;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
