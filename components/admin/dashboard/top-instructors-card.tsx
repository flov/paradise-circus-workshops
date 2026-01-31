"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import type { TopInstructor } from "@/app/admin/stats";

interface TopInstructorsCardProps {
  instructors: TopInstructor[];
}

export function TopInstructorsCard({ instructors }: TopInstructorsCardProps) {
  if (instructors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Instructors</CardTitle>
          <CardDescription>No instructor data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const maxWorkshops = Math.max(...instructors.map((i) => i.workshopCount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Instructors</CardTitle>
        <CardDescription>By total workshops taught</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {instructors.map((instructor, index) => {
          const percentage = (instructor.workshopCount / maxWorkshops) * 100;

          return (
            <Link
              key={instructor.id}
              href={`/artists/${instructor.username}`}
              className="flex items-center gap-3 group hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              {/* Rank badge */}
              <div className="w-6 text-center">
                {index < 3 ? (
                  <span
                    className={`text-lg ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                          ? "text-gray-400"
                          : "text-amber-600"
                    }`}
                  >
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="size-8">
                {instructor.avatarImageUrl && (
                  <AvatarImage
                    src={instructor.avatarImageUrl}
                    alt={instructor.displayName || instructor.username}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(instructor.displayName || instructor.username)}
                </AvatarFallback>
              </Avatar>

              {/* Name and stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {instructor.displayName || instructor.username}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {instructor.workshopCount} workshops
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {instructor.totalParticipants} total participants
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
