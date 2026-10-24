import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { Category, Role, Status } from "@/lib/types";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 16 }).notNull().$type<Role>(),
    phone: varchar("phone", { length: 40 }),
    category: varchar("category", { length: 24 }).$type<Category>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("users_email_key").on(table.email)],
);

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey(),
    reference: varchar("reference", { length: 20 }).notNull(),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    customerEmail: varchar("customer_email", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
    serviceArea: varchar("service_area", { length: 80 }).notNull(),
    category: varchar("category", { length: 24 }).notNull().$type<Category>(),
    description: text("description").notNull(),
    preferredDate: varchar("preferred_date", { length: 10 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("NEW").$type<Status>(),
    providerId: uuid("provider_id").references(() => users.id),
    scheduledDate: varchar("scheduled_date", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("requests_status_idx").on(table.status),
    index("requests_provider_idx").on(table.providerId),
  ],
);

export const statusEvents = pgTable(
  "status_events",
  {
    id: uuid("id").primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    fromStatus: varchar("from_status", { length: 16 }).$type<Status>(),
    toStatus: varchar("to_status", { length: 16 }).notNull().$type<Status>(),
    publicText: text("public_text").notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("status_events_request_idx").on(table.requestId, table.createdAt)],
);

export const internalNotes = pgTable(
  "internal_notes",
  {
    id: uuid("id").primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("internal_notes_request_idx").on(table.requestId, table.createdAt)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 40 }).notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_events_request_idx").on(table.requestId, table.createdAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);
