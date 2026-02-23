import { db } from "@/db"
import { props } from "@/db/schema"
import { asc } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { corsJson, corsOptions } from "@/lib/cors"

async function getAllPropsUncached() {
  return db
    .select({ id: props.id, name: props.name })
    .from(props)
    .orderBy(asc(props.name))
}

const getAllProps = unstable_cache(
  getAllPropsUncached,
  ["api-props-list"],
  { revalidate: 3600, tags: ["props-stats"] },
)

/**
 * List all flow art props
 * @description Returns all props from the catalog (staff, poi, hoops, etc.). Used by the mobile app and profile autocomplete.
 * @response propsListResponseSchema
 * @responseSet public
 */
export async function GET() {
  try {
    const propsList = await getAllProps()
    return corsJson(propsList)
  } catch (error) {
    console.error("API props error:", error)
    return corsJson({ error: "Failed to fetch props" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return corsOptions()
}
