"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { Edit, User, Plus } from "lucide-react";
import { getProfileLinksData } from "@/app/profile/actions";

export function CustomUserButton() {
  const { isLoaded, isSignedIn } = useUser();
  const [profileData, setProfileData] = useState<{
    isArtist: boolean;
    username: string | null;
  } | null>(null);

  useEffect(() => {
    // Only check isLoaded since component is wrapped in <SignedIn>
    if (!isLoaded) {
      return;
    }

    async function fetchProfileLinks() {
      try {
        const data = await getProfileLinksData();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile links:", error);
        setProfileData({ isArtist: false, username: null });
      }
    }

    fetchProfileLinks();
  }, [isLoaded]);

  console.log({ isLoaded, isSignedIn, profileData });

  // Always render MenuItems since component only renders when signed in
  // Show "Create Profile" as default, or profile links if username exists
  return (
    <UserButton>
      <UserButton.MenuItems>
        {profileData?.username ? (
          <>
            <UserButton.Link
              label="Edit Profile"
              href="/profile/edit"
              labelIcon={<Edit className="h-4 w-4" />}
            />
            <UserButton.Link
              label="My Profile"
              href={`/artist/${profileData.username}`}
              labelIcon={<User className="h-4 w-4" />}
            />
          </>
        ) : (
          <UserButton.Link
            label="Create Profile"
            href="/onboarding"
            labelIcon={<Plus className="h-4 w-4" />}
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
