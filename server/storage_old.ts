import { users, diaryEntries, tasks, scheduleItems, type User, type InsertUser, type DiaryEntry, type InsertDiaryEntry, type Task, type InsertTask, type ScheduleItem, type InsertScheduleItem } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

export class MemStorage implements IStorage {
  private diaryEntries: Map<number, DiaryEntry> = new Map();
  private tasks: Map<number, Task> = new Map();
  private scheduleItems: Map<number, ScheduleItem> = new Map();
  private currentDiaryId = 1;
  private currentTaskId = 1;
  private currentScheduleId = 1;

  // Diary operations
  async getDiaryEntriesByDate(date: string): Promise<DiaryEntry[]> {
    return Array.from(this.diaryEntries.values())
      .filter(entry => entry.date === date)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const id = this.currentDiaryId++;
    const newEntry: DiaryEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };
    this.diaryEntries.set(id, newEntry);
    return newEntry;
  }

  async deleteDiaryEntry(id: number): Promise<void> {
    this.diaryEntries.delete(id);
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const newTask: Task = {
      ...task,
      id,
      description: task.description || null,
      dueDate: task.dueDate || null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    const updatedTask: Task = { 
      ...existingTask, 
      ...updates,
      completedAt: updates.status === 'completed' && existingTask.status !== 'completed' 
        ? new Date() 
        : existingTask.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks.delete(id);
  }

  // Schedule operations
  async getAllScheduleItems(): Promise<ScheduleItem[]> {
    return Array.from(this.scheduleItems.values())
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem> {
    const id = this.currentScheduleId++;
    const newItem: ScheduleItem = {
      id,
      title: item.title,
      description: item.description || null,
      time: item.time,
      repeatPattern: item.repeatPattern,
      isActive: item.isActive ?? true,
      color: item.color || "#FF69B4",
    };
    this.scheduleItems.set(id, newItem);
    return newItem;
  }

  async updateScheduleItem(id: number, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const existingItem = this.scheduleItems.get(id);
    if (!existingItem) {
      throw new Error(`Schedule item with id ${id} not found`);
    }
    
    const updatedItem: ScheduleItem = { ...existingItem, ...updates };
    this.scheduleItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteScheduleItem(id: number): Promise<void> {
    this.scheduleItems.delete(id);
  }
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
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
      .where(eq(diaryEntries.id, id))
      .where(eq(diaryEntries.userId, userId));
  }

  // Task operations
  async getAllTasks(userId: number): Promise<Task[]> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return allTasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
      .where(eq(tasks.id, id))
      .where(eq(tasks.userId, userId))
      .returning();
    return updatedTask;
  }

  async deleteTask(userId: number, id: number): Promise<void> {
    await db.delete(tasks)
      .where(eq(tasks.id, id))
      .where(eq(tasks.userId, userId));
  }

  // Schedule operations
  async getAllScheduleItems(userId: number): Promise<ScheduleItem[]> {
    const items = await db.select().from(scheduleItems)
      .where(eq(scheduleItems.userId, userId))
      .where(eq(scheduleItems.isActive, true));
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
      .where(eq(scheduleItems.id, id))
      .where(eq(scheduleItems.userId, userId))
      .returning();
    return updatedItem;
  }

  async deleteScheduleItem(userId: number, id: number): Promise<void> {
    await db.delete(scheduleItems)
      .where(eq(scheduleItems.id, id))
      .where(eq(scheduleItems.userId, userId));
  }
}

export const storage = new DatabaseStorage();
