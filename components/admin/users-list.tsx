import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PromoteAdminButton } from "./promote-admin-button";
import { DemoteAdminButton } from "./demote-admin-button";
import { DeleteUserButton } from "./delete-user-button";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function UsersList() {
  const { userId } = await auth();

  // Get current user's database ID to prevent self-modification
  let currentUserId_db: number | null = null;
  if (userId) {
    const currentUserResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    if (currentUserResult.length > 0) {
      currentUserId_db = currentUserResult[0].id;
    }
  }

  const usersList = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      isAdmin: users.isAdmin,
      isInstructor: users.isInstructor,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.username));

  if (usersList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found.
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersList.map((user) => {
            const isCurrentUser = user.id === currentUserId_db;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{user.displayName || user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{user.email || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.isAdmin && (
                      <Badge variant="default">Admin</Badge>
                    )}
                    {user.isInstructor && (
                      <Badge variant="secondary">Instructor</Badge>
                    )}
                    {!user.isAdmin && !user.isInstructor && (
                      <Badge variant="outline">User</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!isCurrentUser && (
                      <>
                        {user.isAdmin ? (
                          <DemoteAdminButton userId={user.id} />
                        ) : (
                          <PromoteAdminButton userId={user.id} />
                        )}
                        <DeleteUserButton userId={user.id} />
                      </>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
