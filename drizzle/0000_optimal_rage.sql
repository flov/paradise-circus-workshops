CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"workshop_id" integer NOT NULL,
	"participant_name" varchar(255) NOT NULL,
	"participant_email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"notes" text,
	"booking_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"instructor" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"max_capacity" integer DEFAULT 20 NOT NULL,
	"current_bookings" integer DEFAULT 0 NOT NULL,
	"location" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookings_workshop_id" ON "bookings" USING btree ("workshop_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_email" ON "bookings" USING btree ("participant_email");--> statement-breakpoint
CREATE INDEX "idx_workshops_date" ON "workshops" USING btree ("date");