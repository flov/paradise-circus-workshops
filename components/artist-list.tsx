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
import { User, Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  isInstructor: boolean;
  workshopCount?: number;
  props: Array<{ name: string; skillLevel: number }>;
  username: string;
}

interface ArtistListProps {
  artists: Artist[];
}

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
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {getInitials(artist.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name and badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-sm truncate">{artist.name}</span>
          {artist.isInstructor && (
            <Badge variant="default" className="h-5 text-[10px] px-1.5 gap-0.5">
              <User className="size-2.5" />
              Instructor
            </Badge>
          )}
          {artist?.workshopCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 text-[10px] px-1.5 gap-0.5"
            >
              <Eye className="size-2.5" />
              {artist.workshopCount} Workshop
              {artist.workshopCount > 1 ? "s" : ""}
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
                className="h-5 px-1.5 font-normal text-muted-foreground"
              >
                {prop.name}
                <span className="ml-1 text-[9px] opacity-75">
                  {prop.skillLevel}/10
                </span>
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </Link>
  );
}

export function ArtistList({ artists }: ArtistListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [instructorOnly, setInstructorOnly] = useState(false);
  const [selectedProp, setSelectedProp] = useState<string>("all");

  // Get all unique props from all artists
  const allProps = useMemo(
    () =>
      Array.from(
        new Set(artists.flatMap((artist) => artist.props.map((p) => p.name))),
      ).sort(),
    [artists],
  );

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      // Name search
      const matchesSearch = artist.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Instructor filter
      const matchesInstructor = !instructorOnly || artist.isInstructor;

      // Prop filter
      const matchesProp =
        selectedProp === "all" ||
        artist.props.some((p) => p.name === selectedProp);

      return matchesSearch && matchesInstructor && matchesProp;
    });
  }, [artists, searchQuery, instructorOnly, selectedProp]);

  const hasActiveFilters =
    searchQuery || instructorOnly || selectedProp !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setInstructorOnly(false);
    setSelectedProp("all");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Artists</h2>
              <p className="text-sm text-muted-foreground">
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
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={instructorOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setInstructorOnly(!instructorOnly)}
                className="h-9 text-xs"
              >
                <User className="size-3.5 mr-1.5" />
                Instructors
              </Button>

              <Select value={selectedProp} onValueChange={setSelectedProp}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="Filter by prop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All props</SelectItem>
                  {allProps.map((prop) => (
                    <SelectItem key={prop} value={prop} className="text-xs">
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No artists found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
