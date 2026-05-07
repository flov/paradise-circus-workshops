import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  time,
  integer,
  timestamp,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations, InferSelectModel, InferInsertModel } from "drizzle-orm"

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    instructor: varchar("instructor", { length: 255 }),
    instructorId: integer("instructor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    maxCapacity: integer("max_capacity").notNull().default(20),
    currentParticipants: integer("current_participants").notNull().default(0),
    location: varchar("location", { length: 255 }),
    whatToBring: text("what_to_bring"),
    isWorkshop: boolean("is_workshop").notNull().default(true),
    level: varchar("level", { length: 50 }).notNull().default("All levels"),
    isPublished: boolean("is_published").notNull().default(true),
    propId: integer("prop_id").references(() => props.id, {
      onDelete: "set null",
    }),
    recurringSeriesId: varchar("recurring_series_id", { length: 36 }),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringUntil: date("recurring_until"),
    recapVideoId: varchar("recap_video_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastUpdatedBy: integer("last_updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedBy: integer("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    dateIdx: index("idx_events_date").on(table.date),
    recurringSeriesIdIdx: index("idx_events_recurring_series_id").on(
      table.recurringSeriesId,
    ),
    dateIsPublishedIdx: index("idx_events_date_is_published").on(
      table.date,
      table.isPublished,
    ),
    instructorIdIdx: index("idx_events_instructor_id").on(table.instructorId),
    isPublishedIdx: index("idx_events_is_published").on(table.isPublished),
  }),
)

export const participations = pgTable(
  "participations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    clerkUserId: varchar("clerk_user_id", { length: 255 }),
    participantName: varchar("participant_name", { length: 255 }).notNull(),
    participantEmail: varchar("participant_email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    notes: text("notes"),
    participationDate: timestamp("participation_date").defaultNow().notNull(),
    status: varchar("status", { length: 50 }).default("confirmed").notNull(),
    confirmationToken: varchar("confirmation_token", { length: 36 })
      .notNull()
      .unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index("idx_participations_event_id").on(table.eventId),
    emailIdx: index("idx_participations_email").on(table.participantEmail),
    confirmationTokenIdx: index("idx_participations_confirmation_token").on(
      table.confirmationToken,
    ),
  }),
)

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    authorName: varchar("author_name", { length: 255 }).notNull(),
    authorImageUrl: varchar("author_image_url", { length: 500 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index("idx_comments_event_id").on(table.eventId),
    createdAtIdx: index("idx_comments_created_at").on(table.createdAt),
  }),
)

export const eventsRelations = relations(events, ({ many, one }) => ({
  participations: many(participations),
  comments: many(comments),
  prop: one(props, {
    fields: [events.propId],
    references: [props.id],
  }),
  instructor: one(users, {
    fields: [events.instructorId],
    references: [users.id],
  }),
  lastUpdatedByUser: one(users, {
    fields: [events.lastUpdatedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [events.approvedBy],
    references: [users.id],
  }),
}))

export const participationsRelations = relations(participations, ({ one }) => ({
  event: one(events, {
    fields: [participations.eventId],
    references: [events.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  event: one(events, {
    fields: [comments.eventId],
    references: [events.id],
  }),
}))

export const users = pgTable(
  "users",
  {
    availableForPerformances: boolean("available_for_performances")
      .notNull()
      .default(false),
    avatarImageUrl: varchar("avatar_image_url", { length: 500 }),
    bio: text("bio"),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    displayName: varchar("display_name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    experienceStartDate: date("experience_start_date"),
    id: serial("id").primaryKey(),
    instagramHandle: varchar("instagram_handle", { length: 100 }),
    isAdmin: boolean("is_admin").notNull().default(false),
    isInstructor: boolean("is_instructor").notNull().default(false),
    location: varchar("location", { length: 255 }),
    patreonPage: varchar("patreon_page", { length: 255 }),
    performanceStyle: varchar("performance_style", { length: 255 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    vimeoVideos: text("vimeo_videos").array(),
    website: varchar("website", { length: 255 }),
    youtubeVideos: text("youtube_videos").array(),
  },
  (table) => ({
    usernameIdx: index("idx_users_username").on(table.username),
    clerkUserIdIdx: index("idx_users_clerk_user_id").on(table.clerkUserId),
    emailIdx: index("idx_users_email").on(table.email),
  }),
)

export const props = pgTable(
  "props",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_props_name").on(table.name),
  }),
)

export const userProps = pgTable(
  "user_props",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propId: integer("prop_id")
      .notNull()
      .references(() => props.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_props_user_id").on(table.userId),
    propIdIdx: index("idx_user_props_prop_id").on(table.propId),
    userPropUniqueIdx: index("idx_user_props_user_prop_unique").on(
      table.userId,
      table.propId,
    ),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  props: many(userProps),
}))

export const propsRelations = relations(props, ({ many }) => ({
  userProps: many(userProps),
  events: many(events),
}))

export const userPropsRelations = relations(userProps, ({ one }) => ({
  user: one(users, {
    fields: [userProps.userId],
    references: [users.id],
  }),
  prop: one(props, {
    fields: [userProps.propId],
    references: [props.id],
  }),
}))

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    entityLabel: varchar("entity_label", { length: 500 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("idx_activity_logs_created_at").on(table.createdAt),
    entityTypeActionIdx: index("idx_activity_logs_entity_type_action").on(
      table.entityType,
      table.action,
    ),
  }),
)

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Feedback = InferSelectModel<typeof feedbacks>
export type NewFeedback = InferInsertModel<typeof feedbacks>

// Export inferred types for each table
export type Event = InferSelectModel<typeof events>
export type NewEvent = InferInsertModel<typeof events>

/** User fields needed when displaying "Approved By" / "Last Updated By" in event forms */
export type UserDisplayInfo = Pick<User, "id" | "username" | "displayName">

/** Event with optional user relations (from JOINs when querying with lastUpdatedByUser/approvedByUser) */
export type EventWithUserRelations = Event & {
  lastUpdatedByUser?: UserDisplayInfo | null
  approvedByUser?: UserDisplayInfo | null
}

export type Participation = InferSelectModel<typeof participations>
export type NewParticipation = InferInsertModel<typeof participations>

export type Comment = InferSelectModel<typeof comments>
export type NewComment = InferInsertModel<typeof comments>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Prop = InferSelectModel<typeof props>
export type NewProp = InferInsertModel<typeof props>

export type UserProp = InferSelectModel<typeof userProps>
export type NewUserProp = InferInsertModel<typeof userProps>

export type ActivityLog = InferSelectModel<typeof activityLogs>
export type NewActivityLog = InferInsertModel<typeof activityLogs>

