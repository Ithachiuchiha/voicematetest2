import {
  profiles, diaryEntries, tasks, scheduleItems, notifications,
  type Profile, type InsertProfile,
  type DiaryEntry, type InsertDiaryEntry,
  type Task, type InsertTask,
  type ScheduleItem, type InsertScheduleItem,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Profile operations (replaces user operations — auth is handled by Supabase)
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  // Diary
  getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]>;
  createDiaryEntry(userId: string, entry: InsertDiaryEntry): Promise<DiaryEntry>;
  deleteDiaryEntry(userId: string, id: string): Promise<void>;

  // Tasks
  getAllTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(userId: string, id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(userId: string, id: string): Promise<void>;

  // Schedule
  getAllScheduleItems(userId: string): Promise<ScheduleItem[]>;
  createScheduleItem(userId: string, item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(userId: string, id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem>;
  deleteScheduleItem(userId: string, id: string): Promise<void>;

  // Notifications
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(userId: string, id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  // ── Profiles ───────────────────────────────────────────────────────────────

  async getProfile(id: string): Promise<Profile | undefined> {
    const [p] = await getDb().select().from(profiles).where(eq(profiles.id, id));
    return p;
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const [p] = await getDb().select().from(profiles).where(eq(profiles.username, username));
    return p;
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const [p] = await getDb().select().from(profiles).where(eq(profiles.email, email));
    return p;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [p] = await getDb().insert(profiles).values(profile).returning();
    return p;
  }

  // ── Diary ──────────────────────────────────────────────────────────────────

  async getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]> {
    const entries = await getDb().select().from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.entryDate, date)));
    return entries.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createDiaryEntry(userId: string, entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
    const [e] = await getDb().insert(diaryEntries)
      .values({ ...entry, userId, wordCount })
      .returning();
    return e;
  }

  async deleteDiaryEntry(userId: string, id: string): Promise<void> {
    await getDb().delete(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getAllTasks(userId: string): Promise<Task[]> {
    const all = await getDb().select().from(tasks).where(eq(tasks.userId, userId));
    return all.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const [t] = await getDb().insert(tasks).values({ ...task, userId }).returning();
    return t;
  }

  async updateTask(userId: string, id: string, updates: Partial<Task>): Promise<Task> {
    const [t] = await getDb().update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return t;
  }

  async deleteTask(userId: string, id: string): Promise<void> {
    await getDb().delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // ── Schedule ───────────────────────────────────────────────────────────────

  async getAllScheduleItems(userId: string): Promise<ScheduleItem[]> {
    return getDb().select().from(scheduleItems).where(eq(scheduleItems.userId, userId));
  }

  async createScheduleItem(userId: string, item: InsertScheduleItem): Promise<ScheduleItem> {
    const [s] = await getDb().insert(scheduleItems).values({ ...item, userId }).returning();
    return s;
  }

  async updateScheduleItem(userId: string, id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const [s] = await getDb().update(scheduleItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)))
      .returning();
    return s;
  }

  async deleteScheduleItem(userId: string, id: string): Promise<void> {
    await getDb().delete(scheduleItems)
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)));
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return getDb().select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [n] = await getDb().insert(notifications).values(notification).returning();
    return n;
  }

  async markNotificationRead(userId: string, id: string): Promise<void> {
    await getDb().update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
