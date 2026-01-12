import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUserProfile, isUserArtist } from "@/app/profile/actions"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ hasProfile: false, isArtist: false })
    }

    const userIsArtist = await isUserArtist(userId)
    if (!userIsArtist) {
      return NextResponse.json({ hasProfile: false, isArtist: false })
    }

    const profile = await getCurrentUserProfile()

    return NextResponse.json({
      hasProfile: !!profile,
      isArtist: true,
      username: profile?.username || null,
    })
  } catch (error) {
    console.error("Profile links API error:", error)
    return NextResponse.json({ hasProfile: false, isArtist: false })
  }
}
