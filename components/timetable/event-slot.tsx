"use client";

import { Repeat, Calendar } from "lucide-react";
import { createEventSlug } from "@/lib/utils";
import { EditEventButton } from "@/components/admin/edit-event-button";
import {
  toSchemaUserDisplayInfo,
  formatTime,
  formatTimeShort,
  isNotFullHour,
  isLongerThanOneHour,
  isExactlyOneHour,
} from "@/lib/timetable-utils";
import type { TimeSlot, AuthContext } from "@/lib/timetable-utils";

function getLevelBadgeClasses(level: string): string {
  if (level === "Beginner" || level === "Beg/Int") {
    return "border-green-500/60 text-green-700 dark:text-green-400";
  }
  if (level === "Intermediate" || level === "Int/Adv") {
    return "border-yellow-500/60 text-yellow-700 dark:text-yellow-400";
  }
  return "border-red-500/60 text-red-700 dark:text-red-400";
}

function getDesktopColorClasses(
  slot: TimeSlot,
  authContext: AuthContext | null,
): string {
  const isParadiseLake = slot.location === "Paradise River";
  const isParadiseStage = slot.location === "Paradise Stage";
  const isOtherLocation = !isParadiseStage && !isParadiseLake;
  const isPending = !slot.isPublished;
  const hasNoInstructorId =
    authContext?.isAdmin &&
    (slot.instructorId === null || slot.instructorId === undefined);
  const isBlocked = slot.isBlocked === true;

  if (isBlocked) {
    if (isOtherLocation) return "bg-purple-500/10 border border-purple-500/20";
    return isParadiseLake
      ? "bg-blue-500/10 border border-blue-500/20"
      : "bg-red-500/10 border border-red-500/20";
  }

  if (isPending) {
    return "bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 border-dashed";
  }

  const borderStyle = hasNoInstructorId ? "border-dashed" : "border-solid";
  if (isOtherLocation) {
    return `bg-purple-500/20 hover:bg-purple-500/30 border ${borderStyle} border-purple-500/40`;
  }
  return isParadiseLake
    ? `bg-blue-500/20 hover:bg-blue-500/30 border ${borderStyle} border-blue-500/40`
    : `bg-red-500/20 hover:bg-red-500/30 border ${borderStyle} border-red-500/40`;
}

function getMobileColorClasses(
  slot: TimeSlot,
  authContext: AuthContext | null,
): string {
  const isParadiseLake = slot.location === "Paradise River";
  const isParadiseStage = slot.location === "Paradise Stage";
  const isOtherLocation = !isParadiseStage && !isParadiseLake;
  const isPending = !slot.isPublished;
  const hasNoInstructorId =
    authContext?.isAdmin &&
    (slot.instructorId === null || slot.instructorId === undefined);

  if (isPending) {
    return "bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/35 border-yellow-500/50 hover:border-yellow-500/60 active:border-yellow-500/70 border-dashed";
  }

  const borderStyle = hasNoInstructorId ? "border-dashed" : "border-solid";
  if (isOtherLocation) {
    return `bg-purple-500/15 hover:bg-purple-500/25 active:bg-purple-500/30 ${borderStyle} border-purple-500/40 hover:border-purple-500/50 active:border-purple-500/60`;
  }
  return isParadiseLake
    ? `bg-blue-500/15 hover:bg-blue-500/25 active:bg-blue-500/30 ${borderStyle} border-blue-500/40 hover:border-blue-500/50 active:border-blue-500/60`
    : `bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/30 ${borderStyle} border-red-500/40 hover:border-red-500/50 active:border-red-500/60`;
}

function canEditSlot(slot: TimeSlot, authContext: AuthContext | null): boolean {
  if (!authContext) return false;
  if (authContext.isAdmin) return true;
  return (
    authContext.isInstructor &&
    slot.instructorId !== null &&
    slot.instructorId === authContext.userId
  );
}

function buildEditEventProps(slot: TimeSlot) {
  return {
    id: slot.id,
    title: slot.title,
    description: slot.description,
    instructor: slot.instructor || "",
    instructorId:
      slot.instructorId !== null && slot.instructorId !== undefined
        ? slot.instructorId
        : null,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    location: slot.location,
    whatToBring: slot.whatToBring,
    isWorkshop: slot.isWorkshop,
    level: slot.level,
    propId: slot.prop?.id ?? null,
    isPublished: slot.isPublished,
    isRecurring: slot.isRecurring,
    recurringUntil: slot.recurringUntil ?? null,
    lastUpdatedBy: slot.lastUpdatedBy ?? null,
    approvedBy: slot.approvedBy ?? null,
    lastUpdatedByUser: toSchemaUserDisplayInfo(slot.lastUpdatedByUser),
    approvedByUser: toSchemaUserDisplayInfo(slot.approvedByUser),
    createdAt: slot.createdAt ? new Date(slot.createdAt) : new Date(),
  };
}

function RecurringBadge({ slot }: { slot: TimeSlot }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground"
      title={
        slot.recurringUntil
          ? `Recurring event until ${new Date(slot.recurringUntil).toLocaleDateString()}`
          : "Recurring event"
      }
    >
      <Repeat className="h-3 w-3" />
      {slot.recurringUntil && <Calendar className="h-3 w-3" />}
      <span className="sr-only">
        {slot.recurringUntil
          ? "Recurring event with end date"
          : "Recurring event"}
      </span>
    </span>
  );
}

function LevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  if (level === "All levels") return null;
  return (
    <span
      className={`text-xs px-1 rounded shrink-0 border bg-transparent ${getLevelBadgeClasses(level)} ${className ?? ""}`}
    >
      {level}
    </span>
  );
}

export function DesktopEventSlot({
  slot,
  authContext,
}: {
  slot: TimeSlot;
  authContext: AuthContext | null;
}) {
  const isPending = !slot.isPublished;
  const isBlocked = slot.isBlocked === true;

  return (
    <div
      className={`relative block rounded transition-colors h-full ${getDesktopColorClasses(slot, authContext)}`}
    >
      <a
        href={`/event/${createEventSlug(slot.id, slot.title, slot.instructorDisplayName || slot.instructor || "")}`}
        className={`block p-2 ${isBlocked ? "opacity-60" : ""}`}
      >
        <div className="text-sm font-medium text-foreground line-clamp-2">
          {slot.title}
          {isPending && (
            <span className="ml-1 text-xs font-normal text-yellow-600 dark:text-yellow-400">
              (Pending)
            </span>
          )}
        </div>
        {(isNotFullHour(slot.startTime) ||
          isLongerThanOneHour(slot.startTime, slot.endTime)) && (
          <div className="text-xs font-normal text-muted-foreground mt-0.5">
            {formatTimeShort(slot.startTime)} -{" "}
            {formatTimeShort(slot.endTime)}
          </div>
        )}
        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {slot.instructorDisplayName || slot.instructor || ""}
          </div>
          {slot.isWorkshop && <LevelBadge level={slot.level} />}
          {(authContext?.isAdmin || authContext?.isInstructor) &&
            slot.isRecurring && <RecurringBadge slot={slot} />}
        </div>
      </a>
      {canEditSlot(slot, authContext) && (
        <div
          className="absolute top-1 right-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <EditEventButton event={buildEditEventProps(slot)} />
        </div>
      )}
    </div>
  );
}

export function MobileEventSlot({
  slot,
  authContext,
}: {
  slot: TimeSlot;
  authContext: AuthContext | null;
}) {
  const isPending = !slot.isPublished;

  return (
    <div
      className={`relative block rounded-lg border-2 shadow-sm hover:shadow-md active:shadow-sm transition-all duration-150 ${getMobileColorClasses(slot, authContext)}`}
    >
      <a
        href={`/event/${createEventSlug(slot.id, slot.title, slot.instructorDisplayName || slot.instructor || "")}`}
        className="block p-4 cursor-pointer"
      >
        <div className="space-y-1.5">
          <div className="font-medium text-foreground flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="min-w-0">{slot.title}</span>
              {isPending && (
                <span className="text-xs font-normal text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                  (Pending Approval)
                </span>
              )}
              {(authContext?.isAdmin || authContext?.isInstructor) &&
                slot.isRecurring && <RecurringBadge slot={slot} />}
            </span>
            <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">
              {formatTime(slot.startTime)}
              {!isExactlyOneHour(slot.startTime, slot.endTime) && (
                <> - {formatTime(slot.endTime)}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {slot.instructorDisplayName || slot.instructor || "Unknown"}
            </div>
            {slot.isWorkshop && (
              <LevelBadge level={slot.level} className="py-0.5 px-1.5" />
            )}
          </div>
        </div>
      </a>
      {canEditSlot(slot, authContext) && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <EditEventButton event={buildEditEventProps(slot)} />
        </div>
      )}
    </div>
  );
}
