-- Create props table
CREATE TABLE IF NOT EXISTS "props" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "props_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Create event_props table
CREATE TABLE IF NOT EXISTS "event_props" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"prop_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Migrate existing prop names to props table (case-insensitive, deduplicated)
INSERT INTO "props" ("name")
SELECT DISTINCT LOWER(TRIM("prop_name")) as "name"
FROM "user_props"
WHERE "prop_name" IS NOT NULL AND TRIM("prop_name") != ''
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Add prop_id column to user_props
ALTER TABLE "user_props" ADD COLUMN IF NOT EXISTS "prop_id" integer;
--> statement-breakpoint
-- Update user_props to reference props table
UPDATE "user_props" up
SET "prop_id" = p."id"
FROM "props" p
WHERE LOWER(TRIM(up."prop_name")) = p."name"
AND up."prop_id" IS NULL;
--> statement-breakpoint
-- Add foreign key constraints for event_props
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'event_props_event_id_events_id_fk'
	) THEN
		ALTER TABLE "event_props" ADD CONSTRAINT "event_props_event_id_events_id_fk" 
		FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") 
		ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'event_props_prop_id_props_id_fk'
	) THEN
		ALTER TABLE "event_props" ADD CONSTRAINT "event_props_prop_id_props_id_fk" 
		FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") 
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_event_props_event_id" ON "event_props" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_props_prop_id" ON "event_props" USING btree ("prop_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_props_name" ON "props" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_props_prop_id" ON "user_props" USING btree ("prop_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_props_user_prop_unique" ON "user_props" USING btree ("user_id","prop_id");
--> statement-breakpoint
-- Make prop_id NOT NULL and add foreign key constraint (only if all rows have been migrated)
DO $$
BEGIN
	-- Check if all rows have prop_id set
	IF NOT EXISTS (
		SELECT 1 FROM "user_props" WHERE "prop_id" IS NULL AND "prop_name" IS NOT NULL AND TRIM("prop_name") != ''
	) THEN
		-- Make prop_id NOT NULL
		ALTER TABLE "user_props" ALTER COLUMN "prop_id" SET NOT NULL;
		
		-- Add foreign key constraint if it doesn't exist
		IF NOT EXISTS (
			SELECT 1 FROM pg_constraint 
			WHERE conname = 'user_props_prop_id_props_id_fk'
		) THEN
			ALTER TABLE "user_props" ADD CONSTRAINT "user_props_prop_id_props_id_fk" 
			FOREIGN KEY ("prop_id") REFERENCES "public"."props"("id") 
			ON DELETE cascade ON UPDATE no action;
		END IF;
		
		ALTER TABLE "user_props" DROP COLUMN IF EXISTS "prop_name";
	END IF;
END $$;
