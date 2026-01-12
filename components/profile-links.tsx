"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

export function ProfileLinks() {
  const { isLoaded, isSignedIn } = useUser()
  const [profileData, setProfileData] = useState<{
    hasProfile: boolean
    isArtist: boolean
    username: string | null
  } | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return
    }

    async function fetchProfileLinks() {
      try {
        const response = await fetch("/api/profile/links")
        const data = await response.json()
        setProfileData(data)
      } catch (error) {
        console.error("Failed to fetch profile links:", error)
      }
    }

    fetchProfileLinks()
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !isSignedIn || !profileData?.isArtist) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {profileData.hasProfile && profileData.username ? (
        <>
          <Link href="/profile/edit">
            <Button variant="ghost" size="sm">
              Edit Profile
            </Button>
          </Link>
          <Link href={`/artist/${profileData.username}`}>
            <Button variant="ghost" size="sm">
              My Profile
            </Button>
          </Link>
        </>
      ) : (
        <Link href="/profile/create">
          <Button variant="ghost" size="sm">
            Create Profile
          </Button>
        </Link>
      )}
    </div>
  )
}
