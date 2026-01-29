import { db } from "@/db";
import { props, events, userProps } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditPropButton } from "./edit-prop-button";
import { DeletePropButton } from "./delete-prop-button";
import { AddPropButton } from "./add-prop-button";

export async function PropsList() {
  const propsList = await db
    .select({
      id: props.id,
      name: props.name,
      createdAt: props.createdAt,
    })
    .from(props)
    .orderBy(asc(props.name));

  // Get usage counts for each prop
  const propsWithUsage = await Promise.all(
    propsList.map(async (prop) => {
      const eventsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(eq(events.propId, prop.id));

      const userPropsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userProps)
        .where(eq(userProps.propId, prop.id));

      return {
        ...prop,
        eventsCount: Number(eventsCount[0]?.count || 0),
        userPropsCount: Number(userPropsCount[0]?.count || 0),
      };
    })
  );

  if (propsList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No props found. Create your first prop to get started.</p>
        <div className="mt-4">
          <AddPropButton />
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Used in Events</TableHead>
            <TableHead>Used by Users</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propsWithUsage.map((prop) => (
            <TableRow key={prop.id}>
              <TableCell className="font-medium">{prop.name}</TableCell>
              <TableCell>{prop.eventsCount}</TableCell>
              <TableCell>{prop.userPropsCount}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(prop.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <EditPropButton prop={{ id: prop.id, name: prop.name }} />
                  <DeletePropButton
                    propId={prop.id}
                    propName={prop.name}
                    eventsCount={prop.eventsCount}
                    userPropsCount={prop.userPropsCount}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
