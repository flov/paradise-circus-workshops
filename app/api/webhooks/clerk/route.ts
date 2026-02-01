import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { headers } from "next/headers"
import { db } from "@/db"
import { users, participations, comments, events } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(request: NextRequest) {
  console.log("🔔 [WEBHOOK] Received webhook request from Clerk")
  
  // Get the Svix headers for verification
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  console.log("🔔 [WEBHOOK] Headers received:", {
    hasSvixId: !!svixId,
    hasSvixTimestamp: !!svixTimestamp,
    hasSvixSignature: !!svixSignature,
  })

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("❌ [WEBHOOK] Missing required Svix headers")
    return NextResponse.json(
      { error: "Error occurred -- no svix headers" },
      { status: 400 }
    )
  }

  // Get the webhook signing secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!webhookSecret) {
    console.error("❌ [WEBHOOK] CLERK_WEBHOOK_SIGNING_SECRET is not set")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  console.log("✅ [WEBHOOK] Webhook secret found")

  // Get the raw body as text for webhook verification
  const body = await request.text()
  console.log("📦 [WEBHOOK] Raw body received, length:", body.length)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as any
    console.log("✅ [WEBHOOK] Webhook signature verified successfully")
  } catch (err) {
    console.error("❌ [WEBHOOK] Error verifying webhook:", err)
    return NextResponse.json(
      { error: "Error occurred -- webhook verification failed" },
      { status: 400 }
    )
  }

  // Handle the webhook event
  const eventType = evt.type
  console.log("📋 [WEBHOOK] Event type received:", eventType)

  if (eventType === "user.created") {
    console.log("👤 [WEBHOOK] Processing user.created event")
    const clerkUserId = evt.data.id
    const email = evt.data.email_addresses?.[0]?.email_address || null
    const avatarImageUrl = evt.data.image_url || null
    console.log("👤 [WEBHOOK] Clerk User ID:", clerkUserId)
    console.log("📧 [WEBHOOK] Email:", email || "No email provided")
    console.log("🖼️  [WEBHOOK] Avatar Image URL:", avatarImageUrl || "No avatar provided")

    if (!clerkUserId) {
      console.error("❌ [WEBHOOK] No clerkUserId found in webhook payload")
      console.error("📋 [WEBHOOK] Event data:", JSON.stringify(evt.data, null, 2))
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    try {
      // Check if user record already exists (may have been created during onboarding)
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1)

      if (existingUser.length > 0) {
        // Update existing user with email and avatar
        await db
          .update(users)
          .set({ email, avatarImageUrl, updatedAt: new Date() })
          .where(eq(users.clerkUserId, clerkUserId))
        console.log(`✅ [WEBHOOK] Updated email and avatar for existing user: ${clerkUserId}`)
      } else {
        console.log(`ℹ️  [WEBHOOK] User record not found, email and avatar will be saved during onboarding`)
      }
    } catch (error) {
      console.error("❌ [WEBHOOK] Error syncing email for created user:", error)
      if (error instanceof Error) {
        console.error("❌ [WEBHOOK] Error message:", error.message)
        console.error("❌ [WEBHOOK] Error stack:", error.stack)
      }
      return NextResponse.json(
        { error: "Error occurred while syncing user email" },
        { status: 500 }
      )
    }
  } else if (eventType === "user.updated") {
    console.log("🔄 [WEBHOOK] Processing user.updated event")
    const clerkUserId = evt.data.id
    const email = evt.data.email_addresses?.[0]?.email_address || null
    const avatarImageUrl = evt.data.image_url || null
    console.log("👤 [WEBHOOK] Clerk User ID:", clerkUserId)
    console.log("📧 [WEBHOOK] Email:", email || "No email provided")
    console.log("🖼️  [WEBHOOK] Avatar Image URL:", avatarImageUrl || "No avatar provided")

    if (!clerkUserId) {
      console.error("❌ [WEBHOOK] No clerkUserId found in webhook payload")
      console.error("📋 [WEBHOOK] Event data:", JSON.stringify(evt.data, null, 2))
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    try {
      // Update email and avatar for existing user record
      const result = await db
        .update(users)
        .set({ email, avatarImageUrl, updatedAt: new Date() })
        .where(eq(users.clerkUserId, clerkUserId))
        .returning({ id: users.id })

      if (result.length > 0) {
        console.log(`✅ [WEBHOOK] Updated email and avatar for user: ${clerkUserId}`)
      } else {
        console.log(`ℹ️  [WEBHOOK] User record not found for updated user: ${clerkUserId}`)
      }
    } catch (error) {
      console.error("❌ [WEBHOOK] Error syncing email for updated user:", error)
      if (error instanceof Error) {
        console.error("❌ [WEBHOOK] Error message:", error.message)
        console.error("❌ [WEBHOOK] Error stack:", error.stack)
      }
      return NextResponse.json(
        { error: "Error occurred while syncing user email" },
        { status: 500 }
      )
    }
  } else if (eventType === "user.deleted") {
    console.log("🗑️  [WEBHOOK] Processing user.deleted event")
    const clerkUserId = evt.data.id
    console.log("👤 [WEBHOOK] Clerk User ID:", clerkUserId)

    if (!clerkUserId) {
      console.error("❌ [WEBHOOK] No clerkUserId found in webhook payload")
      console.error("📋 [WEBHOOK] Event data:", JSON.stringify(evt.data, null, 2))
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    try {
      console.log("🔍 [WEBHOOK] Starting cleanup for user:", clerkUserId)
      
      // Check if user record exists and get database ID
      const userRecord = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1)

      console.log(`👤 [WEBHOOK] User record found:`, userRecord.length > 0 ? `Yes (username: ${userRecord[0]?.username})` : "No")

      if (userRecord.length > 0) {
        const userId = userRecord[0].id

        // Find and delete all events where user is the instructor
        // This will cascade delete participations and comments for those events
        const userEvents = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.instructorId, userId))

        console.log(`📅 [WEBHOOK] Found ${userEvents.length} event(s) where user is instructor`)

        if (userEvents.length > 0) {
          await db.delete(events).where(eq(events.instructorId, userId))
          console.log(`✅ [WEBHOOK] Deleted ${userEvents.length} event(s) (participations and comments for these events were cascade deleted)`)
        } else {
          console.log("ℹ️  [WEBHOOK] No events to delete")
        }

        // Find all participations for this user in remaining events (events they didn't create)
        const userParticipations = await db
          .select({ eventId: participations.eventId })
          .from(participations)
          .where(eq(participations.clerkUserId, clerkUserId))

        console.log(`📅 [WEBHOOK] Found ${userParticipations.length} participation(s) for user in other events`)

        // Group participations by eventId and count them
        const participationsByEvent = userParticipations.reduce((acc, participation) => {
          acc[participation.eventId] = (acc[participation.eventId] || 0) + 1
          return acc
        }, {} as Record<number, number>)

        console.log("📊 [WEBHOOK] Participations by event:", participationsByEvent)

        // Delete all participations for this user
        if (userParticipations.length > 0) {
          await db.delete(participations).where(eq(participations.clerkUserId, clerkUserId))
          console.log(`✅ [WEBHOOK] Deleted ${userParticipations.length} participation(s)`)

          // Update participation counts for affected events
          for (const [eventId, count] of Object.entries(participationsByEvent)) {
            await db
              .update(events)
              .set({ currentBookings: sql`${events.currentBookings} - ${count}` })
              .where(eq(events.id, parseInt(eventId)))
            console.log(`📉 [WEBHOOK] Updated event ${eventId} participation count: -${count}`)
          }
        } else {
          console.log("ℹ️  [WEBHOOK] No participations to delete")
        }

        // Find and delete all comments for this user in remaining events (events they didn't create)
        const userComments = await db
          .select({ id: comments.id })
          .from(comments)
          .where(eq(comments.clerkUserId, clerkUserId))

        console.log(`💬 [WEBHOOK] Found ${userComments.length} comment(s) for user in other events`)

        if (userComments.length > 0) {
          await db.delete(comments).where(eq(comments.clerkUserId, clerkUserId))
          console.log(`✅ [WEBHOOK] Deleted ${userComments.length} comment(s)`)
        } else {
          console.log("ℹ️  [WEBHOOK] No comments to delete")
        }

        // Delete the user record (this will cascade delete userProps automatically)
        await db.delete(users).where(eq(users.clerkUserId, clerkUserId))
        console.log(`✅ [WEBHOOK] Deleted user record (userProps will cascade delete)`)
      } else {
        console.log("ℹ️  [WEBHOOK] No user record to delete")
      }

      console.log(`✅ [WEBHOOK] Successfully cleaned up all data for deleted user: ${clerkUserId}`)
    } catch (error) {
      console.error("❌ [WEBHOOK] Error cleaning up user data:", error)
      if (error instanceof Error) {
        console.error("❌ [WEBHOOK] Error message:", error.message)
        console.error("❌ [WEBHOOK] Error stack:", error.stack)
      }
      return NextResponse.json(
        { error: "Error occurred while cleaning up user data" },
        { status: 500 }
      )
    }
  } else {
    console.log(`ℹ️  [WEBHOOK] Event type '${eventType}' not handled, ignoring`)
  }

  console.log("✅ [WEBHOOK] Webhook processed successfully")
  return NextResponse.json({ received: true, eventType }, { status: 200 })
}
