import { unstable_cache } from "next/cache"
import { getUserByUsername, getUserProps, getUserWorkshops } from "@/app/profile/actions"
import { corsJson, corsOptions } from "@/lib/cors"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params

  try {
    const getData = unstable_cache(
      async () => {
        const user = await getUserByUsername(username)
        if (!user) return null

        const [props, workshops] = await Promise.all([
          getUserProps(user.id),
          getUserWorkshops(user.id),
        ])
        return { user, props, workshops }
      },
      [`api-artist-${username}`],
      { revalidate: 3600, tags: ["artists", `artist-${username}`] },
    )

    const data = await getData()

    if (!data) {
      return corsJson({ error: "Artist not found" }, { status: 404 })
    }

    return corsJson(data)
  } catch (error) {
    console.error("API artist profile error:", error)
    return corsJson({ error: "Failed to fetch artist profile" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return corsOptions()
}
