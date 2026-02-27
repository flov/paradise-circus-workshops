import type { UserDisplayInfo as SchemaUserDisplayInfo } from "@/db/schema";

export type UserDisplayInfo = {
  id: number;
  username: string | null;
  displayName: string | null;
};

export type TimeSlot = {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  instructorId: number | null;
  instructorDisplayName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  whatToBring: string | null;
  isWorkshop: boolean;
  level: string;
  propId: number | null;
  isPublished: boolean;
  isRecurring: boolean;
  recurringSeriesId: string | null;
  recurringUntil: string | null;
  createdAt?: string;
  isBlocked?: boolean;
  lastUpdatedBy?: number | null;
  approvedBy?: number | null;
  lastUpdatedByUser?: UserDisplayInfo | null;
  approvedByUser?: UserDisplayInfo | null;
};

export type TimetableData = {
  [day: string]: {
    [time: string]: TimeSlot[];
  };
};

export type AuthContext = {
  isAdmin: boolean;
  isInstructor: boolean;
  userId: number | null;
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const TIME_SLOTS = [
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
];

/** Normalize API user data to schema's UserDisplayInfo (username must be string) */
export function toSchemaUserDisplayInfo(
  user: UserDisplayInfo | null | undefined,
): SchemaUserDisplayInfo | null {
  if (!user) return null;
  return { ...user, username: user.username ?? "" };
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function getMondayOfWeek(weekOffset: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekOffsetFromDate(mondayDate: Date): number {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + mondayOffset);
  currentMonday.setHours(0, 0, 0, 0);

  const targetMonday = new Date(mondayDate);
  targetMonday.setHours(0, 0, 0, 0);

  const diffTime = targetMonday.getTime() - currentMonday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 7);
}

export function hourToTimeSlot(hour: number): string {
  if (hour >= 12) {
    return `${hour === 12 ? 12 : hour - 12}pm`;
  }
  return `${hour}am`;
}

export function calculateDurationHours(
  startTime: string,
  endTime: string,
): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return Math.ceil(durationMinutes / 60);
}

export function convertTimeSlotToTime(timeSlot: string): string {
  const timeStr = timeSlot.replace(/[ap]m/i, "");
  const hour = Number.parseInt(timeStr);

  if (timeSlot.toLowerCase().includes("pm")) {
    const hour24 = hour === 12 ? 12 : hour + 12;
    return `${String(hour24).padStart(2, "0")}:00`;
  } else {
    const hour24 = hour === 12 ? 0 : hour;
    return `${String(hour24).padStart(2, "0")}:00`;
  }
}

export function getNextTimeSlot(timeSlot: string): string {
  const currentIndex = TIME_SLOTS.indexOf(timeSlot);
  if (currentIndex === -1 || currentIndex === TIME_SLOTS.length - 1) {
    return "23:00";
  }
  const nextSlot = TIME_SLOTS[currentIndex + 1];
  return convertTimeSlotToTime(nextSlot);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatTimeShort(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours);
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}`;
}

export function isNotFullHour(time: string): boolean {
  const [, minutes] = time.split(":");
  return Number.parseInt(minutes) !== 0;
}

export function isLongerThanOneHour(
  startTime: string,
  endTime: string,
): boolean {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  return endTotalMinutes - startTotalMinutes > 60;
}

export function isExactlyOneHour(
  startTime: string,
  endTime: string,
): boolean {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  return endTotalMinutes - startTotalMinutes === 60;
}

export function organizeEvents(events: any[]): TimetableData {
  const organized: TimetableData = {};

  events.forEach((event: any) => {
    const date = new Date(event.date);
    const dayIndex = (date.getDay() + 6) % 7;
    const dayName = DAYS[dayIndex];

    const startHour = Number.parseInt(event.startTime.split(":")[0]);
    const startTimeSlot = hourToTimeSlot(startHour);
    const durationHours = calculateDurationHours(
      event.startTime,
      event.endTime,
    );

    if (!organized[dayName]) organized[dayName] = {};
    if (!organized[dayName][startTimeSlot])
      organized[dayName][startTimeSlot] = [];

    const baseSlot = {
      id: event.id,
      title: event.title,
      description: event.description,
      instructor: event.instructor,
      instructorId: event.instructorId || null,
      instructorDisplayName: event.instructorDisplayName || null,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      whatToBring: event.whatToBring,
      isWorkshop: event.isWorkshop,
      level: event.level ?? "All levels",
      propId: event.propId || null,
      isPublished: event.isPublished !== undefined ? event.isPublished : true,
      isRecurring: event.isRecurring ?? false,
      recurringSeriesId: event.recurringSeriesId || null,
      recurringUntil: event.recurringUntil || null,
      createdAt: event.createdAt,
      lastUpdatedBy: event.lastUpdatedBy ?? null,
      approvedBy: event.approvedBy ?? null,
      lastUpdatedByUser: event.lastUpdatedByUser ?? null,
      approvedByUser: event.approvedByUser ?? null,
    };

    organized[dayName][startTimeSlot].push(baseSlot);

    for (let i = 1; i < durationHours; i++) {
      const nextHour = startHour + i;
      const nextTimeSlot = hourToTimeSlot(nextHour);

      if (TIME_SLOTS.indexOf(nextTimeSlot) !== -1) {
        if (!organized[dayName][nextTimeSlot])
          organized[dayName][nextTimeSlot] = [];
        organized[dayName][nextTimeSlot].push({ ...baseSlot, isBlocked: true });
      }
    }
  });

  return organized;
}

export function getCurrentTimeSlot(): string | null {
  const now = new Date();
  const hour = now.getHours();

  if (hour === 11) return "11am";
  if (hour >= 12 && hour <= 22) {
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  }

  return null;
}
