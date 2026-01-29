import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropsList } from "@/components/admin/props-list";
import { AddPropButton } from "@/components/admin/add-prop-button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { NormalizeProps } from "@/components/admin/normalize-props";

export default async function AdminPropsPage() {
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
        title="Props Management"
        description="Create, edit, and delete props"
      >
        <AddPropButton />
      </AdminNav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NormalizeProps />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Manage Props</CardTitle>
            <CardDescription>
              Create, edit, and delete props used in events and user profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropsList />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
