import { z } from "zod";

// Common schemas
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD");

export const positiveIntSchema = z.coerce.number().int().positive();

// API query params
export const timetableQuerySchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
});

export const timetableAuthQuerySchema = timetableQuerySchema.extend({
  userId: z.coerce.number().int().positive().optional(),
});

export const usernameParamSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be no more than 30 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username can only contain letters, numbers, dots, hyphens, and underscores"
  );

// API path/query schemas for OpenAPI docs
export const artistUsernameParamsSchema = z.object({
  username: usernameParamSchema,
});

export const authMeResponseSchema = z.object({
  isAdmin: z.boolean().describe("Whether the user is an admin"),
  isInstructor: z.boolean().describe("Whether the user is an instructor"),
  userId: z.string().nullable().describe("Clerk user ID when signed in"),
});

export const propItemSchema = z.object({
  id: z.number().int().describe("Prop ID"),
  name: z.string().describe("Prop name"),
});

export const propsListResponseSchema = z.array(propItemSchema);

// API response schemas for OpenAPI docs
export const artistPropSchema = z.object({
  name: z.string().describe("Prop name"),
  skillLevel: z.number().int().describe("Skill level 0-5"),
});

export const artistListItemSchema = z.object({
  id: z.string().describe("Artist ID"),
  name: z.string().describe("Display name"),
  avatar: z.string().optional().describe("Avatar URL"),
  username: z.string().describe("Username"),
  isInstructor: z.boolean().describe("Whether the artist is an instructor"),
  workshopCount: z.number().int().describe("Number of workshops taught"),
  props: z.array(artistPropSchema).describe("Props and skill levels"),
  videoCount: z.number().int().describe("Total video count"),
  bio: z.string().optional().describe("Artist bio"),
  instagramHandle: z.string().optional().describe("Instagram handle"),
  patreonPage: z.string().optional().describe("Patreon page URL"),
  website: z.string().optional().describe("Personal website URL"),
  availableForPerformances: z.boolean().describe("Available for performances"),
  isAdmin: z.boolean().describe("Whether the artist is an admin"),
});

export const artistsListResponseSchema = z.array(artistListItemSchema);

export const artistUserPropSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  propId: z.number().int(),
  propName: z.string(),
  skillLevel: z.number().int(),
  createdAt: z.string().describe("ISO 8601 datetime"),
});

export const workshopEventSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  instructor: z.string().nullable(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  currentParticipants: z.number().int(),
  location: z.string().nullable(),
  isRecurring: z.boolean(),
});

export const artistProfileUserSchema = z.object({
  id: z.number().int(),
  clerkUserId: z.string(),
  email: z.string().nullable(),
  username: z.string(),
  displayName: z.string().nullable(),
  isInstructor: z.boolean(),
  isAdmin: z.boolean(),
  bio: z.string().nullable(),
  instagramHandle: z.string().nullable(),
  patreonPage: z.string().nullable(),
  website: z.string().nullable(),
  youtubeVideos: z.array(z.string()).nullable(),
  vimeoVideos: z.array(z.string()).nullable(),
  experienceStartDate: z.string().nullable(),
  performanceStyle: z.string().nullable(),
  availableForPerformances: z.boolean(),
  location: z.string().nullable(),
  avatarImageUrl: z.string().nullable(),
  createdAt: z.string().describe("ISO 8601 datetime"),
  updatedAt: z.string().describe("ISO 8601 datetime"),
});

export const artistProfileWorkshopsSchema = z.object({
  upcoming: z.array(workshopEventSchema),
  past: z.array(workshopEventSchema),
});

export const artistProfileResponseSchema = z.object({
  user: artistProfileUserSchema,
  props: z.array(artistUserPropSchema),
  workshops: artistProfileWorkshopsSchema,
});

const userRefSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  displayName: z.string().nullable(),
});

export const timetableInstructorProfileSchema = z.object({
  id: z.number().int(),
  displayName: z.string().nullable(),
  username: z.string(),
  bio: z.string().nullable(),
  instagramHandle: z.string().nullable(),
  avatarImageUrl: z.string().nullable(),
  youtubeVideos: z.array(z.string()).nullable(),
  vimeoVideos: z.array(z.string()).nullable(),
  experienceStartDate: z.string().nullable(),
  performanceStyle: z.string().nullable(),
  availableForPerformances: z.boolean(),
  location: z.string().nullable(),
});

export const timetableEventSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  instructor: z.string().nullable(),
  instructorId: z.number().int().nullable(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  whatToBring: z.string().nullable(),
  isWorkshop: z.boolean(),
  currentParticipants: z.number().int(),
  propId: z.number().int().nullable(),
  isPublished: z.boolean(),
  isRecurring: z.boolean(),
  recurringSeriesId: z.string().nullable(),
  recurringUntil: z.string().nullable(),
  recapVideoId: z.string().nullable(),
  createdAt: z.string().describe("ISO 8601 datetime"),
  instructorProfile: timetableInstructorProfileSchema.nullable(),
  lastUpdatedByUser: userRefSchema.nullable().optional(),
  approvedByUser: userRefSchema.nullable().optional(),
  instructorDisplayName: z.string().nullable(),
  instructorAvatarUrl: z.string().nullable(),
});

export const timetableResponseSchema = z.array(timetableEventSchema);

export const timetablePublicResponseSchema = z.array(timetableEventSchema);

export const icsContentSchema = z
  .string()
  .describe("ICS calendar file content (text/calendar)");

// Server action inputs
export const createParticipationSchema = z.object({
  eventId: positiveIntSchema,
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const addCommentSchema = z.object({
  eventId: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
});

export const profileSchema = z.object({
  username: usernameParamSchema,
  displayName: z.string().min(1, "Display name is required"),
  instagramHandle: z
    .string()
    .max(30, "Instagram handle must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9._]*[a-zA-Z0-9_])?$/,
      "Invalid Instagram handle format. Use letters, numbers, dots, and underscores only."
    )
    .nullable()
    .optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: dateStringSchema,
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
});
