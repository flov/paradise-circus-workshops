import { NextRequest, NextResponse } from "next/server"
import { extendRecurringEvents } from "@/app/admin/actions"

/**
 * Cron job endpoint to extend recurring events.
 * This endpoint is called by Vercel Cron to ensure recurring events
 * always have at least 10 days of future events.
 * 
 * Schedule: Daily at 2 AM UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    // Vercel Cron sends a special header: x-vercel-cron
    const cronHeader = request.headers.get("x-vercel-cron")
    
    // In production, verify the cron header
    // For local development/testing, allow direct access
    if (process.env.NODE_ENV === "production" && !cronHeader) {
      return NextResponse.json(
        { error: "Unauthorized. This endpoint can only be called by Vercel Cron." },
        { status: 401 }
      )
    }

    console.log("Starting recurring events extension cron job...")
    
    const result = await extendRecurringEvents()
    
    if (result.success) {
      console.log(
        `Cron job completed successfully. Created ${result.eventsCreated} event(s) across ${result.seriesProcessed} series.`
      )
      return NextResponse.json({
        success: true,
        message: `Extended recurring events successfully`,
        eventsCreated: result.eventsCreated,
        seriesProcessed: result.seriesProcessed,
      })
    } else {
      console.error("Cron job failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to extend recurring events",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
