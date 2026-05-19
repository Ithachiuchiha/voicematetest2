import { users, diaryEntries, tasks, scheduleItems, type User, type InsertUser, type DiaryEntry, type InsertDiaryEntry, type Task, type InsertTask, type ScheduleItem, type InsertScheduleItem } from "@shared/schema";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Diary operations
  getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]>;
  createDiaryEntry(userId: string, entry: InsertDiaryEntry): Promise<DiaryEntry>;
  deleteDiaryEntry(userId: string, id: string): Promise<void>;

  // Task operations
  getAllTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(userId: string, id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(userId: string, id: string): Promise<void>;

  // Schedule operations
  getAllScheduleItems(userId: string): Promise<ScheduleItem[]>;
  createScheduleItem(userId: string, item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(userId: string, id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem>;
  deleteScheduleItem(userId: string, id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  async getUser(id: string): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = getDb();
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const db = getDb();
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  // ── Diary ──────────────────────────────────────────────────────────────────

  async getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]> {
    const db = getDb();
    // entryDate is a DATE column — compare as string "YYYY-MM-DD"
    const entries = await db.select().from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.entryDate, date)));
    return entries.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createDiaryEntry(userId: string, entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const db = getDb();
    const [newEntry] = await db
      .insert(diaryEntries)
      .values({ ...entry, userId })
      .returning();
    return newEntry;
  }

  async deleteDiaryEntry(userId: string, id: string): Promise<void> {
    const db = getDb();
    await db.delete(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getAllTasks(userId: string): Promise<Task[]> {
    const db = getDb();
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return allTasks.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const db = getDb();
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, userId })
      .returning();
    return newTask;
  }

  async updateTask(userId: string, id: string, updates: Partial<Task>): Promise<Task> {
    const db = getDb();
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updatedTask;
  }

  async deleteTask(userId: string, id: string): Promise<void> {
    const db = getDb();
    await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // ── Schedule ───────────────────────────────────────────────────────────────

  async getAllScheduleItems(userId: string): Promise<ScheduleItem[]> {
    const db = getDb();
    return db.select().from(scheduleItems).where(eq(scheduleItems.userId, userId));
  }

  async createScheduleItem(userId: string, item: InsertScheduleItem): Promise<ScheduleItem> {
    const db = getDb();
    const [newItem] = await db
      .insert(scheduleItems)
      .values({ ...item, userId })
      .returning();
    return newItem;
  }

  async updateScheduleItem(userId: string, id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const db = getDb();
    const [updatedItem] = await db
      .update(scheduleItems)
      .set(updates)
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)))
      .returning();
    return updatedItem;
  }

  async deleteScheduleItem(userId: string, id: string): Promise<void> {
    const db = getDb();
    await db.delete(scheduleItems)
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
