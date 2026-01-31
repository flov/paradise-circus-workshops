import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { TopInstructorsCard } from "@/components/admin/dashboard/top-instructors-card";
import { getTopInstructors } from "../../stats";

export default async function InstructorsStatsPage() {
  const startTime = Date.now();
  
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

  // Fetch top instructors statistics
  const topInstructors = await getTopInstructors(10);
  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        title="Top Instructors Statistics"
        description={`Loaded in ${loadTime}ms`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TopInstructorsCard instructors={topInstructors} />
      </main>
    </div>
  );
}
