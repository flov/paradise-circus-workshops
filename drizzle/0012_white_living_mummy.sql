ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");