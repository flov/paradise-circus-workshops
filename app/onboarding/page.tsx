import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { hasUserRecord, createUserRecord } from "@/app/profile/actions"
import { OnboardingForm } from "@/components/onboarding-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function OnboardingPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Check if user already has a record
  const hasRecord = await hasUserRecord(userId)
  if (hasRecord) {
    redirect("/")
  }

  // Get Clerk user to extract username
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect("/sign-in")
  }

  // Get username from Clerk (required field)
  const clerkUsername = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "user"
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Paradise Circus!</h1>
              <p className="text-muted-foreground">Let's get you set up</p>
            </div>
            
            <OnboardingForm initialUsername={clerkUsername} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
