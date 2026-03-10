CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
