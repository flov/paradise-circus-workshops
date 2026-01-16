"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export function ProfileLinks() {
  const { isLoaded, isSignedIn } = useUser()
  const [profileData, setProfileData] = useState<{
    isArtist: boolean
    username: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false)
      return
    }

    async function fetchProfileLinks() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/profile/links")
        if (!response.ok) {
          throw new Error("Failed to fetch profile links")
        }
        const data = await response.json()
        setProfileData(data)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load profile links"
        console.error("Failed to fetch profile links:", error)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileLinks()
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !isSignedIn) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profileData?.isArtist) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {profileData.username ? (
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
