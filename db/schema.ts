import { pgTable, serial, varchar, text, date, time, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { relations, InferSelectModel, InferInsertModel } from "drizzle-orm";

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    instructor: varchar("instructor", { length: 255 }),
    instructorId: integer("instructor_id").references(() => users.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    maxCapacity: integer("max_capacity").notNull().default(20),
    currentBookings: integer("current_bookings").notNull().default(0),
    location: varchar("location", { length: 255 }),
    whatToBring: text("what_to_bring"),
    isWorkshop: boolean("is_workshop").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(true),
    propId: integer("prop_id").references(() => props.id, { onDelete: "set null" }),
    recurringSeriesId: varchar("recurring_series_id", { length: 36 }),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringUntil: date("recurring_until"),
    recapVideoId: varchar("recap_video_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("idx_events_date").on(table.date),
    recurringSeriesIdIdx: index("idx_events_recurring_series_id").on(table.recurringSeriesId),
    dateIsPublishedIdx: index("idx_events_date_is_published").on(table.date, table.isPublished),
    instructorIdIdx: index("idx_events_instructor_id").on(table.instructorId),
    isPublishedIdx: index("idx_events_is_published").on(table.isPublished),
  })
);

export const participations = pgTable(
  "participations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    clerkUserId: varchar("clerk_user_id", { length: 255 }),
    participantName: varchar("participant_name", { length: 255 }).notNull(),
    participantEmail: varchar("participant_email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    notes: text("notes"),
    participationDate: timestamp("participation_date").defaultNow().notNull(),
    status: varchar("status", { length: 50 }).default("confirmed").notNull(),
    confirmationToken: varchar("confirmation_token", { length: 36 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index("idx_participations_event_id").on(table.eventId),
    emailIdx: index("idx_participations_email").on(table.participantEmail),
    confirmationTokenIdx: index("idx_participations_confirmation_token").on(table.confirmationToken),
  })
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
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
  })
);

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
}));

export const participationsRelations = relations(participations, ({ one }) => ({
  event: one(events, {
    fields: [participations.eventId],
    references: [events.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  event: one(events, {
    fields: [comments.eventId],
    references: [events.id],
  }),
}));

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    username: varchar("username", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }),
    isInstructor: boolean("is_instructor").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    bio: text("bio"),
    instagramHandle: varchar("instagram_handle", { length: 100 }),
    patreonPage: varchar("patreon_page", { length: 255 }),
    website: varchar("website", { length: 255 }),
    youtubeVideos: text("youtube_videos").array(),
    vimeoVideos: text("vimeo_videos").array(),
    experienceStartDate: date("experience_start_date"),
    performanceStyle: varchar("performance_style", { length: 255 }),
    availableForPerformances: boolean("available_for_performances").notNull().default(false),
    location: varchar("location", { length: 255 }),
    avatarImageUrl: varchar("avatar_image_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index("idx_users_username").on(table.username),
    clerkUserIdIdx: index("idx_users_clerk_user_id").on(table.clerkUserId),
    emailIdx: index("idx_users_email").on(table.email),
  })
);

export const props = pgTable(
  "props",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_props_name").on(table.name),
  })
);

export const userProps = pgTable(
  "user_props",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    propId: integer("prop_id").notNull().references(() => props.id, { onDelete: "cascade" }),
    skillLevel: integer("skill_level").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_props_user_id").on(table.userId),
    propIdIdx: index("idx_user_props_prop_id").on(table.propId),
    userPropUniqueIdx: index("idx_user_props_user_prop_unique").on(table.userId, table.propId),
  })
);


export const usersRelations = relations(users, ({ many }) => ({
  props: many(userProps),
}));

export const propsRelations = relations(props, ({ many }) => ({
  userProps: many(userProps),
  events: many(events),
}));

export const userPropsRelations = relations(userProps, ({ one }) => ({
  user: one(users, {
    fields: [userProps.userId],
    references: [users.id],
  }),
  prop: one(props, {
    fields: [userProps.propId],
    references: [props.id],
  }),
}));


// Export inferred types for each table
export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export type Participation = InferSelectModel<typeof participations>;
export type NewParticipation = InferInsertModel<typeof participations>;

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Prop = InferSelectModel<typeof props>;
export type NewProp = InferInsertModel<typeof props>;

export type UserProp = InferSelectModel<typeof userProps>;
export type NewUserProp = InferInsertModel<typeof userProps>;


export type AdminSetting = InferSelectModel<typeof adminSettings>;
export type NewAdminSetting = InferInsertModel<typeof adminSettings>;