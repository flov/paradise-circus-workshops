"use server"

import { db } from "@/db"
import { feedbacks } from "@/db/schema"
import { desc, lt } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "@/app/profile/actions"
import type { Feedback } from "@/db/schema"

const PAGE_SIZE = 20

export async function loadMoreFeedback(
  cursor: string,
): Promise<{ rows: Feedback[]; hasMore: boolean }> {
  const { userId } = await auth()
  if (!userId) return { rows: [], hasMore: false }

  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) return { rows: [], hasMore: false }

  const rows = await db
    .select()
    .from(feedbacks)
    .where(lt(feedbacks.createdAt, new Date(cursor)))
    .orderBy(desc(feedbacks.createdAt))
    .limit(PAGE_SIZE + 1)

  const hasMore = rows.length > PAGE_SIZE
  if (hasMore) rows.pop()

  return { rows, hasMore }
}
