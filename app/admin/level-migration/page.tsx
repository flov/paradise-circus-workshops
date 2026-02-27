import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LevelMigrationTool } from "@/components/admin/level-migration-tool";

export default async function LevelMigrationPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Level Migration"
        description="Extract level information from event titles into the level field"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Extract Level from Titles</CardTitle>
            <CardDescription>
              Detects events with level keywords (Beginner, Intermediate,
              Advanced) in their title and migrates them to the level field while
              cleaning the title.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LevelMigrationTool />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
