-- Lock down PostgREST exposure: app uses Drizzle + postgres role (bypasses RLS).
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."participations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."user_props" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."props" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."users" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."comments" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."participations" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."user_props" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."props" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."activity_logs" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."events" FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."feedbacks" FROM anon, authenticated;
