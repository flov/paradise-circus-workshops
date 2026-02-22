CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"actor_name" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100),
	"entity_label" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "last_updated_by" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_entity_type_action" ON "activity_logs" USING btree ("entity_type","action");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;