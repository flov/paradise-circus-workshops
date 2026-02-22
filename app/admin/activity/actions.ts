"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, lt } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/app/profile/actions";
import type { ActivityLog } from "@/db/schema";

export async function loadMoreActivity(
  cursor: string,
): Promise<{ logs: ActivityLog[]; hasMore: boolean }> {
  const { userId } = await auth();
  if (!userId) {
    return { logs: [], hasMore: false };
  }

  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return { logs: [], hasMore: false };
  }

  const PAGE_SIZE = 50;

  const logs = await db
    .select()
    .from(activityLogs)
    .where(lt(activityLogs.createdAt, new Date(cursor)))
    .orderBy(desc(activityLogs.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = logs.length > PAGE_SIZE;
  if (hasMore) logs.pop();

  return { logs, hasMore };
}
