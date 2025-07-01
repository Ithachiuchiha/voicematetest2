import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // not_started, started, progress, completed, halted
  priority: text("priority").notNull(), // low, medium, high
  dueDate: text("due_date"), // YYYY-MM-DD format
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  time: text("time").notNull(), // HH:MM format
  repeatPattern: text("repeat_pattern").notNull(), // daily, weekdays, weekends, custom
  isActive: boolean("is_active").notNull().default(true),
  color: text("color").notNull().default("#FF69B4"),
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  timestamp: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertScheduleItemSchema = createInsertSchema(scheduleItems).omit({
  id: true,
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;
