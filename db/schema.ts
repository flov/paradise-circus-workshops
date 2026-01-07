import { pgTable, serial, varchar, text, date, time, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const workshops = pgTable(
  "workshops",
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
    dateIdx: index("idx_workshops_date").on(table.date),
  })
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    workshopId: integer("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
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
    workshopIdIdx: index("idx_bookings_workshop_id").on(table.workshopId),
    emailIdx: index("idx_bookings_email").on(table.participantEmail),
    confirmationTokenIdx: index("idx_bookings_confirmation_token").on(table.confirmationToken),
  })
);

export const workshopsRelations = relations(workshops, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  workshop: one(workshops, {
    fields: [bookings.workshopId],
    references: [workshops.id],
  }),
}));

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

