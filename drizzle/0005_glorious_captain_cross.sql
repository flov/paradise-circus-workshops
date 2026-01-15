-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_image_url" varchar(500),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create user_props table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_props" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"prop_name" varchar(100) NOT NULL,
	"skill_level" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"is_artist" boolean DEFAULT false NOT NULL,
	"is_instructor" boolean DEFAULT false NOT NULL,
	"bio" text,
	"instagram_handle" varchar(100),
	"youtube_videos" text[],
	"experience_start_date" date,
	"performance_style" varchar(255),
	"available_for_performances" boolean DEFAULT false NOT NULL,
	"location" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
-- Add foreign key constraint for comments if it doesn't exist
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'comments_event_id_events_id_fk'
	) THEN
		ALTER TABLE "comments" ADD CONSTRAINT "comments_event_id_events_id_fk" 
		FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") 
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
-- Add foreign key constraint for user_props if it doesn't exist
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'user_props_user_id_users_id_fk'
	) THEN
		ALTER TABLE "user_props" ADD CONSTRAINT "user_props_user_id_users_id_fk" 
		FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "idx_comments_event_id" ON "comments" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_created_at" ON "comments" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_props_user_id" ON "user_props" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users" USING btree ("username");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_clerk_user_id" ON "users" USING btree ("clerk_user_id");
