import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersList } from "@/components/admin/users-list";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/app/profile/actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminUsersPage() {
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
        title="User Management"
        description="Manage users, promote admins, and delete users"
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage all users in the system. Promote users to admin
              or delete users as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersList />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
