"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PropStat } from "@/app/admin/stats";

interface PropsByUsersChartProps {
  stats: PropStat[];
}

export function PropsByUsersChart({ stats }: PropsByUsersChartProps) {
  const maxCount = Math.max(...stats.map((s) => s.userCount), 1);
  const [hoveredProp, setHoveredProp] = useState<number | null>(null);
  const [openDialogPropId, setOpenDialogPropId] = useState<number | null>(null);
  const [openUserDialogId, setOpenUserDialogId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  // Filter to only show props with at least 2 artists
  const propsWithUsers = stats.filter((s) => s.userCount >= 2);

  // Helper function to render user details
  const renderUserDetails = (user: PropStat["users"][0]) => (
    <div className="space-y-1">
      <p className="font-medium">{user.displayName || user.username}</p>
      <p className="text-xs text-muted-foreground">Skill: {user.skillLevel}/10</p>
      {user.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {user.bio.slice(0, 100)}
          {user.bio.length > 100 ? "..." : ""}
        </p>
      )}
      <p className="text-xs text-primary">View profile →</p>
    </div>
  );

  // Helper function to render artist list content
  const renderArtistList = (prop: PropStat) => (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <h4 className="font-semibold">{prop.propName}</h4>
        <Badge variant="secondary">
          {prop.userCount} artist{prop.userCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      {prop.users.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            showing {Math.min(prop.users.length, 13)} of {prop.userCount} artists using this prop
          </p>
          <div className="flex flex-wrap gap-2">
            {prop.users.slice(0, 13).map((user) => (
              <div key={user.id}>
                {isMobile ? (
                  // Mobile: Clickable avatar that opens Dialog
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenUserDialogId(user.id);
                      }}
                      className="block hover:ring-2 hover:ring-primary rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <Avatar className="size-8">
                        {user.avatarImageUrl && (
                          <AvatarImage
                            src={user.avatarImageUrl}
                            alt={user.displayName || user.username}
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.displayName || user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <Dialog
                      open={openUserDialogId === user.id}
                      onOpenChange={(open) => {
                        setOpenUserDialogId(open ? user.id : null);
                      }}
                    >
                      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>
                            {user.displayName || user.username}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="size-16">
                              {user.avatarImageUrl && (
                                <AvatarImage
                                  src={user.avatarImageUrl}
                                  alt={user.displayName || user.username}
                                />
                              )}
                              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {getInitials(user.displayName || user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Skill Level
                              </p>
                              <p className="text-lg font-semibold">
                                {user.skillLevel}/10
                              </p>
                            </div>
                          </div>
                          {user.bio && (
                            <div>
                              <p className="text-sm font-medium mb-1">About</p>
                              <p className="text-sm text-muted-foreground">
                                {user.bio}
                              </p>
                            </div>
                          )}
                          <Link
                            href={`/artists/${user.username}`}
                            className="block w-full text-center text-sm font-medium text-primary hover:underline"
                            onClick={() => setOpenUserDialogId(null)}
                          >
                            View full profile →
                          </Link>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  // Desktop: Tooltip on hover
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/artists/${user.username}`}
                        className="block hover:ring-2 hover:ring-primary rounded-full transition-all"
                      >
                        <Avatar className="size-8">
                          {user.avatarImageUrl && (
                            <AvatarImage
                              src={user.avatarImageUrl}
                              alt={user.displayName || user.username}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.displayName || user.username)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      {renderUserDetails(user)}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
            {prop.userCount > prop.users.length && (
              <div className="flex items-center justify-center size-8 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                +{prop.userCount - prop.users.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (propsWithUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Props by Artists</CardTitle>
          <CardDescription>No props data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Props by Artists</CardTitle>
        <CardDescription className="space-y-1">
          <div className="text-xs text-muted-foreground/80">
            Statistics update every 8 hours to improve response time. Only props
            with at least 2 users are shown.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {propsWithUsers.map((prop, index) => {
          const percentage = (prop.userCount / maxCount) * 100;
          const isHovered = hoveredProp === prop.propId;
          const isDialogOpen = openDialogPropId === prop.propId;

          // Prop bar component (reusable)
          const propBar = (
            <div
              className={cn(
                "cursor-pointer group",
                isMobile && "touch-manipulation",
              )}
              {...(isMobile && {
                onClick: () => setOpenDialogPropId(prop.propId),
              })}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium group-hover:text-primary transition-colors">
                  {prop.propName}
                </span>
                <span className="text-muted-foreground">
                  {prop.userCount} artist{prop.userCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    "bg-gradient-to-r from-purple-500 to-pink-500",
                    (isHovered || isDialogOpen) && "brightness-110",
                  )}
                  style={{
                    width: `${percentage}%`,
                    animationDelay: `${index * 50}ms`,
                  }}
                />
              </div>
            </div>
          );

          return (
            <div key={prop.propId}>
              {isMobile ? (
                // Mobile: Clickable div that opens Dialog
                <>
                  {propBar}
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setOpenDialogPropId(open ? prop.propId : null);
                    }}
                  >
                    <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                      {renderArtistList(prop)}
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                // Desktop: HoverCard
                <HoverCard
                  openDelay={200}
                  closeDelay={100}
                  onOpenChange={(open) =>
                    setHoveredProp(open ? prop.propId : null)
                  }
                >
                  <HoverCardTrigger asChild>{propBar}</HoverCardTrigger>
                  <HoverCardContent className="w-80" side="top" align="start">
                    {renderArtistList(prop)}
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
