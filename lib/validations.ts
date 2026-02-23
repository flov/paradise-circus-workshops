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

// Server action inputs
export const createBookingSchema = z.object({
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
