import { pgTable, serial, varchar, text, date, time, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    instructor: varchar("instructor", { length: 255 }).notNull(),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    maxCapacity: integer("max_capacity").notNull().default(20),
    currentBookings: integer("current_bookings").notNull().default(0),
    location: varchar("location", { length: 255 }),
    whatToBring: text("what_to_bring"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("idx_events_date").on(table.date),
  })
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    clerkUserId: varchar("clerk_user_id", { length: 255 }),
    participantName: varchar("participant_name", { length: 255 }).notNull(),
    participantEmail: varchar("participant_email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    notes: text("notes"),
    bookingDate: timestamp("booking_date").defaultNow().notNull(),
    status: varchar("status", { length: 50 }).default("confirmed").notNull(),
    confirmationToken: varchar("confirmation_token", { length: 36 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index("idx_bookings_event_id").on(table.eventId),
    emailIdx: index("idx_bookings_email").on(table.participantEmail),
    confirmationTokenIdx: index("idx_bookings_confirmation_token").on(table.confirmationToken),
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

export const eventsRelations = relations(events, ({ many }) => ({
  bookings: many(bookings),
  comments: many(comments),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
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
