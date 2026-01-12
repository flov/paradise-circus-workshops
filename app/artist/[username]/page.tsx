import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByUsername, getUserProps } from "@/app/profile/actions";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Instagram, Youtube, Award } from "lucide-react";

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user || !user.isArtist) {
    notFound();
  }

  // Get props
  const props = await getUserProps(user.id);

  // Get Clerk user for profile picture
  let profileImageUrl: string | null = null;
  try {
    const clerkUser = await clerkClient().users.getUser(user.clerkUserId);
    profileImageUrl = clerkUser.imageUrl || null;
  } catch (error) {
    console.error("Failed to fetch Clerk user:", error);
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={user.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                <span className="text-4xl font-bold text-muted-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-bold">{user.username}</h1>
              {user.isInstructor && (
                <Badge variant="default" className="text-sm">
                  <Award className="h-3 w-3 mr-1" />
                  Instructor
                </Badge>
              )}
              {user.availableForPerformances && (
                <Badge variant="secondary" className="text-sm">
                  Available for Performances
                </Badge>
              )}
            </div>

            {user.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}

            {user.instagramHandle && (
              <div>
                <a
                  href={`https://instagram.com/${user.instagramHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  <span>{user.instagramHandle}</span>
                </a>
              </div>
            )}

            {user.yearsOfExperience && (
              <p className="text-muted-foreground">
                {user.yearsOfExperience}{" "}
                {user.yearsOfExperience === 1 ? "year" : "years"} of experience
              </p>
            )}

            {user.performanceStyle && (
              <p className="text-muted-foreground">
                Performance style:{" "}
                <span className="font-medium">{user.performanceStyle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {user.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Props & Skills */}
        {props.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Props & Skills</h2>
              <div className="space-y-4">
                {props.map((prop) => (
                  <div key={prop.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{prop.propName}</span>
                      <span className="text-sm text-muted-foreground">
                        Level {prop.skillLevel}/10
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(prop.skillLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* YouTube Videos */}
        {user.youtubeVideos && user.youtubeVideos.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Videos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.youtubeVideos.map((videoId, index) => (
                  <div key={index} className="aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      title={`Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
