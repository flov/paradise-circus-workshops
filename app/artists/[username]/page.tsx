import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getUserByUsername,
  getUserProps,
  getUserWorkshops,
} from "@/app/profile/actions";
import { getYouTubeEmbedUrl, getVimeoEmbedUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import {
  MapPin,
  Instagram,
  Award,
  Video,
  ExternalLink,
  Sparkles,
  Calendar,
  Shield,
  Code,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "Paradise Circus • Artist Not Found",
    };
  }

  return {
    title: `Paradise Circus • ${user.displayName || user.username}'s artistic profile`,
  };
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  // Get props
  const props = await getUserProps(user.id);

  // Get workshops
  const workshops = await getUserWorkshops(user.id);

  // Get profile image from database
  const profileImageUrl = user.avatarImageUrl || null;
  const isFlowWizard =
    (user.displayName || user.username) === "The Flow Wizard";

  return (
    <div className="container mx-auto max-w-4xl py-4 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={user.displayName || user.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                <span className="text-4xl font-bold text-muted-foreground">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-bold">
                {user.displayName || user.username}
              </h1>
              {isFlowWizard && (
                <Badge variant="default" className="text-sm">
                  <Code className="h-3 w-3 mr-1" />
                  Developer
                </Badge>
              )}
              {user.isAdmin && (
                <Badge variant="default" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {user.isInstructor && (
                <Badge variant="default" className="text-sm">
                  <Award className="h-3 w-3 mr-1" />
                  Instructor
                </Badge>
              )}
              {user.availableForPerformances && (
                <Badge
                  variant="secondary"
                  className="text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                >
                  <Sparkles className="size-2.5" />
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

            {user.patreonPage && (
              <div>
                <a
                  href={user.patreonPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Patreon</span>
                </a>
              </div>
            )}

            {user.website && (
              <div>
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Website</span>
                </a>
              </div>
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
            <CardHeader>
              <CardTitle className="text-xl">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {user.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Props & Skills */}
        {props.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Props & Skills</CardTitle>
            </CardHeader>
            <CardContent>
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

        {/* Workshops */}
        {(workshops.upcoming.length > 0 || workshops.past.length > 0) && (
          <>
            {/* Upcoming Workshops */}
            {workshops.upcoming.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Workshops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid gap-4 ${
                      workshops.upcoming.length === 1
                        ? "grid-cols-1"
                        : workshops.upcoming.length === 2
                          ? "grid-cols-1 md:grid-cols-2"
                          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {workshops.upcoming.map((workshop) => (
                      <EventCard
                        key={workshop.id}
                        event={workshop}
                        instructorDisplayName={
                          user.displayName || user.username
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Workshops */}
            {workshops.past.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Past Workshops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid gap-4 ${
                      workshops.past.length === 1
                        ? "grid-cols-1"
                        : workshops.past.length === 2
                          ? "grid-cols-1 md:grid-cols-2"
                          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {workshops.past.map((workshop) => (
                      <EventCard
                        key={workshop.id}
                        event={workshop}
                        instructorDisplayName={
                          user.displayName || user.username
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Videos */}
        {((user.youtubeVideos && user.youtubeVideos.length > 0) ||
          (user.vimeoVideos && user.vimeoVideos.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Video className="h-5 w-5" />
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.youtubeVideos?.map((videoId, index) => (
                  <div key={`youtube-${index}`} className="aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      title={`YouTube Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                ))}
                {user.vimeoVideos?.map((videoId, index) => (
                  <div key={`vimeo-${index}`} className="aspect-video">
                    <iframe
                      src={getVimeoEmbedUrl(videoId)}
                      title={`Vimeo Video ${index + 1}`}
                      allow="autoplay; fullscreen; picture-in-picture"
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
