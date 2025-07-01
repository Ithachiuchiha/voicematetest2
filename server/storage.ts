import { diaryEntries, tasks, scheduleItems, type DiaryEntry, type InsertDiaryEntry, type Task, type InsertTask, type ScheduleItem, type InsertScheduleItem } from "@shared/schema";

export interface IStorage {
  // Diary operations
  getDiaryEntriesByDate(date: string): Promise<DiaryEntry[]>;
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  deleteDiaryEntry(id: number): Promise<void>;

  // Task operations
  getAllTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Schedule operations
  getAllScheduleItems(): Promise<ScheduleItem[]>;
  createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(id: number, updates: Partial<ScheduleItem>): Promise<ScheduleItem>;
  deleteScheduleItem(id: number): Promise<void>;
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

export const storage = new MemStorage();
