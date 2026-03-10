import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { isAdmin } from "@/app/profile/actions"
import { AdminNav } from "@/components/admin/admin-nav"
import { FeedbackList } from "@/components/admin/feedback-list"
import { loadMoreFeedback } from "@/app/admin/feedback/actions"

export const metadata = { title: "Feedback" }

// Start cursor just after now so the first page fetches everything up to now
const INITIAL_CURSOR = new Date(Date.now() + 1000).toISOString()

export default async function AdminFeedbackPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) redirect("/")

  const { rows, hasMore } = await loadMoreFeedback(INITIAL_CURSOR)

  return (
    <div className="min-h-screen bg-background">
      <AdminNav title="Feedback" description="User-submitted feedback" />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <FeedbackList initialRows={rows} initialHasMore={hasMore} />
      </main>
    </div>
  )
}
