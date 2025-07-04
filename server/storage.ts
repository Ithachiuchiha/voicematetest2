import { users, diaryEntries, tasks, scheduleItems, type User, type InsertUser, type DiaryEntry, type InsertDiaryEntry, type Task, type InsertTask, type ScheduleItem, type InsertScheduleItem } from "@shared/schema";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;

  // Diary operations
  getDiaryEntriesByDate(userId: number, date: string): Promise<DiaryEntry[]>;
  createDiaryEntry(userId: number, entry: InsertDiaryEntry): Promise<DiaryEntry>;
  deleteDiaryEntry(userId: number, id: number): Promise<void>;

  // Task operations
  getAllTasks(userId: number): Promise<Task[]>;
  createTask(userId: number, task: InsertTask): Promise<Task>;
  updateTask(userId: number, id: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(userId: number, id: number): Promise<void>;

  // Schedule operations
  getAllScheduleItems(userId: number): Promise<ScheduleItem[]>;
  createScheduleItem(userId: number, item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(userId: number, id: number, updates: Partial<ScheduleItem>): Promise<ScheduleItem>;
  deleteScheduleItem(userId: number, id: number): Promise<void>;
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Diary operations
  async getDiaryEntriesByDate(userId: number, date: string): Promise<DiaryEntry[]> {
    const entries = await db.select().from(diaryEntries)
      .where(and(eq(diaryEntries.userId, userId), eq(diaryEntries.date, date)));
    return entries.sort((a: DiaryEntry, b: DiaryEntry) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createDiaryEntry(userId: number, entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const [newEntry] = await db
      .insert(diaryEntries)
      .values({ ...entry, userId })
      .returning();
    return newEntry;
  }

  async deleteDiaryEntry(userId: number, id: number): Promise<void> {
    await db.delete(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
  }

  // Task operations
  async getAllTasks(userId: number): Promise<Task[]> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return allTasks.sort((a: Task, b: Task) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createTask(userId: number, task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, userId })
      .returning();
    return newTask;
  }

  async updateTask(userId: number, id: number, updates: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updatedTask;
  }

  async deleteTask(userId: number, id: number): Promise<void> {
    await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // Schedule operations
  async getAllScheduleItems(userId: number): Promise<ScheduleItem[]> {
    const items = await db.select().from(scheduleItems)
      .where(and(eq(scheduleItems.userId, userId), eq(scheduleItems.isActive, true)));
    return items;
  }

  async createScheduleItem(userId: number, item: InsertScheduleItem): Promise<ScheduleItem> {
    const [newItem] = await db
      .insert(scheduleItems)
      .values({ ...item, userId })
      .returning();
    return newItem;
  }

  async updateScheduleItem(userId: number, id: number, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const [updatedItem] = await db
      .update(scheduleItems)
      .set(updates)
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)))
      .returning();
    return updatedItem;
  }

  async deleteScheduleItem(userId: number, id: number): Promise<void> {
    await db.delete(scheduleItems)
      .where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId)));
  }
}

export const storage = new DatabaseStorage();