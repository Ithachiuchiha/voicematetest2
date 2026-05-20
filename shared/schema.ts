import { pgTable, text, boolean, timestamp, date, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── public.profiles ──────────────────────────────────────────────────────────
// id is the SAME UUID as auth.users.id — Supabase Auth creates it, we mirror it.
// FK constraints on all data tables point here (profiles.id === auth.users.id).
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),                         // NOT defaultRandom() — comes from auth
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),             // cached for username→email lookup
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── diary_entries ────────────────────────────────────────────────────────────
export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  entryDate: date("entry_date").notNull(),
  mood: text("mood"),
  wordCount: integer("word_count"),
  isVoice: boolean("is_voice").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── tasks ────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isVoice: boolean("is_voice").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ── schedule_items ───────────────────────────────────────────────────────────
export const scheduleItems = pgTable("schedule_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  scheduledTime: text("scheduled_time").notNull(),
  repeatType: text("repeat_type").notNull().default("none"),
  repeatDays: text("repeat_days"),                     // comma-separated e.g. "1,3,5"
  isActive: boolean("is_active").notNull().default(true),
  color: text("color").notNull().default("#FF69B4"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),                        // 'task_due' | 'task_overdue' | 'schedule_reminder'
  refId: uuid("ref_id"),
  refTable: text("ref_table"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Insert schemas ────────────────────────────────────────────────────────────

export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true });

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true, createdAt: true, updatedAt: true, userId: true, wordCount: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true, createdAt: true, updatedAt: true, completedAt: true, userId: true,
});

export const insertScheduleItemSchema = createInsertSchema(scheduleItems).omit({
  id: true, userId: true, createdAt: true, updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true, createdAt: true,
});

// ── Auth schemas ──────────────────────────────────────────────────────────────
// Sign-in still accepts username — backend does the profiles → email lookup.

export const signUpSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Forgot password now only needs email — Supabase sends a reset link directly.
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
