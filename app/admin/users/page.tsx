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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                User Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage users, promote admins, and delete users
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
