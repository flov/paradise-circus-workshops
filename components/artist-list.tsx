"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Eye,
  Search,
  X,
  Video,
  Instagram,
  Heart,
  Sparkles,
  FileText,
  Shield,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  isInstructor: boolean;
  isAdmin?: boolean;
  workshopCount?: number;
  props: Array<{ name: string; skillLevel: number }>;
  username: string;
  videoCount?: number;
  bio?: string;
  patreonPage?: string;
  instagramHandle?: string;
  availableForPerformances?: boolean;
  createdAt: Date;
}

interface ArtistListProps {
  artists: Artist[];
}

type SortOption = "date-newest" | "name" | "props-most";

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.username}`}
      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage
          src={artist.avatar || "/placeholder.svg"}
          alt={artist.name}
        />
        <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">
          {getInitials(artist.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name and badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-base truncate">{artist.name}</span>
          {artist.isAdmin && (
            <Badge variant="default" className="h-5 text-xs px-1.5 gap-0.5">
              <Shield className="size-2.5" />
              Admin
            </Badge>
          )}
          {artist.isInstructor && (
            <Badge variant="default" className="h-5 text-xs px-1.5 gap-0.5">
              <User className="size-2.5" />
              Instructor
            </Badge>
          )}
          {/* @ts-expect-error - undefined > 0 evaluates to false, preventing 0 from being displayed */}
          {artist?.workshopCount > 0 && (
            <Badge variant="purple" className="h-5 text-xs px-1.5 gap-0.5">
              <Eye className="size-2.5" />
              {artist.workshopCount!} Workshop
              {artist.workshopCount! > 1 ? "s" : ""}
            </Badge>
          )}
          {/* @ts-expect-error - undefined > 0 evaluates to false, preventing 0 from being displayed */}
          {artist?.videoCount > 0 && (
            <Badge variant="purple" className="h-5 text-xs px-1.5 gap-0.5">
              <Video className="size-2.5" />
              {artist.videoCount!} Video
              {artist.videoCount! > 1 ? "s" : ""}
            </Badge>
          )}
          {artist.patreonPage && (
            <Badge variant="pink" className="h-5 text-xs px-1.5 gap-0.5">
              <Heart className="size-2.5" />
              Patreon
            </Badge>
          )}
          {artist.instagramHandle && (
            <Badge variant="purple" className="h-5 text-xs px-1.5 gap-0.5">
              <Instagram className="size-2.5" />
            </Badge>
          )}
          {artist.availableForPerformances && (
            <Badge variant="amber" className="h-5 text-xs px-1.5 gap-0.5">
              <Sparkles className="size-2.5" />
              Available
            </Badge>
          )}
        </div>

        {/* Props row */}
        {artist.props.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {artist.props.map((prop) => (
              <Badge
                key={prop.name}
                variant="outline"
                className="h-5 px-1.5 font-normal text-sm text-muted-foreground"
              >
                {prop.name}
                <span className="ml-1 text-xs opacity-75">
                  {prop.skillLevel}/10
                </span>
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </Link>
  );
}

export function ArtistList({ artists }: ArtistListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [instructorOnly, setInstructorOnly] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);
  const [videosOnly, setVideosOnly] = useState(false);
  const [bioOnly, setBioOnly] = useState(false);
  const [selectedProp, setSelectedProp] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");

  // Get all unique props from all artists
  const allProps = useMemo(
    () =>
      Array.from(
        new Set(artists.flatMap((artist) => artist.props.map((p) => p.name))),
      ).sort(),
    [artists],
  );

  const filteredArtists = useMemo(() => {
    return artists
      .filter((artist) => {
        // Name search
        const matchesSearch = artist.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // Instructor filter
        const matchesInstructor = !instructorOnly || artist.isInstructor;

        // Admin filter
        const matchesAdmin = !adminOnly || artist.isAdmin;

        // Videos filter
        const matchesVideos = !videosOnly || (artist.videoCount ?? 0) > 0;

        // Bio filter
        const matchesBio = !bioOnly || Boolean(artist.bio?.trim());

        // Prop filter
        const matchesProp =
          selectedProp === "all" ||
          artist.props.some((p) => p.name === selectedProp);

        return (
          matchesSearch &&
          matchesInstructor &&
          matchesAdmin &&
          matchesVideos &&
          matchesBio &&
          matchesProp
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "date-newest":
            const dateA =
              a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB =
              b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          case "props-most":
            return b.props.length - a.props.length;
          default:
            return 0;
        }
      });
  }, [
    artists,
    searchQuery,
    instructorOnly,
    adminOnly,
    videosOnly,
    bioOnly,
    selectedProp,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery ||
    instructorOnly ||
    adminOnly ||
    videosOnly ||
    bioOnly ||
    selectedProp !== "all" ||
    sortBy !== "date-newest";

  const clearFilters = () => {
    setSearchQuery("");
    setInstructorOnly(false);
    setAdminOnly(false);
    setVideosOnly(false);
    setBioOnly(false);
    setSelectedProp("all");
    setSortBy("date-newest");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Artists</h2>
              <p className="text-base text-muted-foreground">
                {filteredArtists.length} of {artists.length} performer
                {artists.length !== 1 ? "s" : ""}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Search and filters */}
          <div className="flex flex-col gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Select value={selectedProp} onValueChange={setSelectedProp}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue placeholder="Filter by prop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All props</SelectItem>
                    {allProps.map((prop) => (
                      <SelectItem key={prop} value={prop} className="text-sm">
                        {prop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOption)}
                >
                  <SelectTrigger className="h-9 w-full text-sm">
                    <ArrowUpDown className="size-3.5 mr-1.5" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-newest">Newest artist first</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="props-most">Most props</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={instructorOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInstructorOnly(!instructorOnly)}
                  className="h-9 text-sm"
                >
                  <User className="size-3.5 mr-1.5" />
                  Instructors
                </Button>

                <Button
                  variant={videosOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVideosOnly(!videosOnly)}
                  className="h-9 text-sm"
                >
                  <Video className="size-3.5 mr-1.5" />
                  Videos
                </Button>

                <Button
                  variant={bioOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBioOnly(!bioOnly)}
                  className="h-9 text-sm"
                >
                  <FileText className="size-3.5 mr-1.5" />
                  Bio
                </Button>

                <Button
                  variant={adminOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAdminOnly(!adminOnly)}
                  className="h-9 text-sm"
                >
                  <Shield className="size-3.5 mr-1.5" />
                  Admin
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-base">
              No artists found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
