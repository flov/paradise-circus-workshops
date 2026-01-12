import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getCurrentUserProfile, isUserArtist } from "@/app/profile/actions"
import { ProfileForm } from "@/components/profile-form"

export default async function CreateProfilePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user is an artist
  const userIsArtist = await isUserArtist(userId)
  if (!userIsArtist) {
    redirect("/")
  }

  // Check if profile already exists
  const existingProfile = await getCurrentUserProfile()
  if (existingProfile) {
    redirect("/profile/edit")
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Your Artist Profile</h1>
          <p className="text-muted-foreground mt-2">
            Set up your artist profile to showcase your skills and connect with the community.
          </p>
        </div>
        
        <ProfileForm />
      </div>
    </div>
  )
}
