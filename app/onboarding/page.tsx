import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { hasUserRecord } from "@/app/profile/actions"
import { ProfileForm } from "@/components/profile-form"

export default async function OnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user already has a record
  const hasRecord = await hasUserRecord(userId)
  if (hasRecord) {
    redirect("/profile/edit")
  }

  // Get Clerk user to extract username
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect("/sign-in")
  }

  // Get username from Clerk (required field)
  const clerkUsername = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "user"
  
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Paradise Circus!</h1>
          <p className="text-muted-foreground mt-2">
            Let's get you set up with your artist profile
          </p>
        </div>
        
        <ProfileForm initialData={{ username: clerkUsername }} />
      </div>
    </div>
  )
}
