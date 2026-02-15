import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Purge all caches - call after restoring database to force fresh data.
 */
export async function GET(request: NextRequest) {
  try {
    // Revalidate all paths and tags we use
    revalidatePath("/", "layout");
    revalidatePath("/timetable");
    revalidatePath("/artists");
    revalidatePath("/instagram");
    revalidatePath("/sitemap.xml");

    revalidateTag("workshops-this-week");
    revalidateTag("artists-count");
    revalidateTag("artists");
    revalidateTag("events");
    revalidateTag("timetable-public");
    revalidateTag("instagram-timetable");
    revalidateTag("props-stats");

    return NextResponse.json({
      success: true,
      message: "Cache purged. Pages will refetch fresh data on next request.",
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Revalidation failed", details: String(error) },
      { status: 500 }
    );
  }
}
