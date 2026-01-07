ALTER TABLE "bookings" ADD COLUMN "confirmation_token" varchar(36);
--> statement-breakpoint
UPDATE "bookings" SET "confirmation_token" = gen_random_uuid()::text WHERE "confirmation_token" IS NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "confirmation_token" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_confirmation_token_unique" UNIQUE("confirmation_token");
--> statement-breakpoint
CREATE INDEX "idx_bookings_confirmation_token" ON "bookings" USING btree ("confirmation_token");