ALTER TABLE "events" ALTER COLUMN "instructor" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "instructor_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;