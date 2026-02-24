import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ParticipationsList } from "@/components/admin/participations-list";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminParticipationsPage() {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Participations"
        description="View and manage participant participations"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Participations</CardTitle>
            <CardDescription>
              View and manage participant participations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParticipationsList />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
