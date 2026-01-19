import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  getCurrentUserProfile,
  getUserProps,
  hasUserRecord,
} from "@/app/profile/actions";
import { ProfileForm } from "@/components/profile-form";

export default async function EditProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has completed onboarding
  const hasRecord = await hasUserRecord(userId);
  if (!hasRecord) {
    redirect("/onboarding");
  }

  // Get current profile
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/profile/create");
  }

  // Get props
  const props = await getUserProps(profile.id);

  // Get profile image from database
  const profileImageUrl = profile.avatarImageUrl || null;

  const initialData = {
    ...profile,
    displayName: profile.displayName ?? undefined,
    bio: profile.bio ?? undefined,
    instagramHandle: profile.instagramHandle ?? undefined,
    performanceStyle: profile.performanceStyle ?? undefined,
    location: profile.location ?? undefined,
    youtubeVideos: profile.youtubeVideos?.join(", ") ?? undefined,
    props: props.map((p) => ({
      propName: p.propName,
      skillLevel: p.skillLevel,
    })),
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Your Artist Profile</h1>
        </div>

        <ProfileForm initialData={initialData} profileImageUrl={profileImageUrl} />
      </div>
    </div>
  );
}
