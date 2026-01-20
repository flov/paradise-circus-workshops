"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { Edit, User, Plus } from "lucide-react";
import { getProfileLinksData } from "@/app/profile/actions";

export function CustomUserButton() {
  const { isLoaded, isSignedIn } = useUser();
  const [profileData, setProfileData] = useState<{
    username: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchProfileLinks() {
      try {
        const data = await getProfileLinksData();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile links:", error);
        setProfileData({ username: null });
      }
    }

    fetchProfileLinks();
  }, [isLoaded]);

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="Edit Profile"
          href="/profile/edit"
          labelIcon={<Edit className="h-4 w-4" />}
        />
        <UserButton.Link
          label="My Profile"
          href={
            profileData?.username
              ? `/artists/${profileData?.username}`
              : "onboarding"
          }
          labelIcon={<User className="h-4 w-4" />}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
