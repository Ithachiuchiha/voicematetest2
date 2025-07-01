import type { DiaryEntry, Task, ScheduleItem } from "@shared/schema";

const STORAGE_KEYS = {
  DIARY_ENTRIES: 'voice_mate_diary_entries',
  TASKS: 'voice_mate_tasks',
  SCHEDULE_ITEMS: 'voice_mate_schedule_items',
  SETTINGS: 'voice_mate_settings',
} as const;

interface AppSettings {
  notificationsEnabled: boolean;
  voiceLanguage: string;
  theme: 'light' | 'dark';
}

class LocalStorageManager {
  private isClient = typeof window !== 'undefined';

  // Generic storage methods
  private getItem<T>(key: string): T | null {
    if (!this.isClient) return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  }

  private removeItem(key: string): void {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error);
    }
  }

  // Diary entries
  getDiaryEntries(): DiaryEntry[] {
    return this.getItem<DiaryEntry[]>(STORAGE_KEYS.DIARY_ENTRIES) || [];
  }

  saveDiaryEntry(entry: DiaryEntry): void {
    const entries = this.getDiaryEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
    this.setItem(STORAGE_KEYS.DIARY_ENTRIES, entries);
  }

  deleteDiaryEntry(id: number): void {
    const entries = this.getDiaryEntries();
    const filtered = entries.filter(entry => entry.id !== id);
    this.setItem(STORAGE_KEYS.DIARY_ENTRIES, filtered);
  }

  getDiaryEntriesByDate(date: string): DiaryEntry[] {
    const entries = this.getDiaryEntries();
    return entries.filter(entry => entry.date === date);
  }

  // Tasks
  getTasks(): Task[] {
    return this.getItem<Task[]>(STORAGE_KEYS.TASKS) || [];
  }

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  deleteTask(id: number): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(task => task.id !== id);
    this.setItem(STORAGE_KEYS.TASKS, filtered);
  }

  getTasksByStatus(status: string): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(task => task.status === status);
  }

  // Schedule items
  getScheduleItems(): ScheduleItem[] {
    return this.getItem<ScheduleItem[]>(STORAGE_KEYS.SCHEDULE_ITEMS) || [];
  }

  saveScheduleItem(item: ScheduleItem): void {
    const items = this.getScheduleItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    
    this.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, items);
  }

  deleteScheduleItem(id: number): void {
    const items = this.getScheduleItems();
    const filtered = items.filter(item => item.id !== id);
    this.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, filtered);
  }

  // Settings
  getSettings(): AppSettings {
    return this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS) || {
      notificationsEnabled: true,
      voiceLanguage: 'en-US',
      theme: 'light',
    };
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, updatedSettings);
  }

  // Utility methods
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      diaryEntries: this.getDiaryEntries(),
      tasks: this.getTasks(),
      scheduleItems: this.getScheduleItems(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.diaryEntries) {
        this.setItem(STORAGE_KEYS.DIARY_ENTRIES, data.diaryEntries);
      }
      
      if (data.tasks) {
        this.setItem(STORAGE_KEYS.TASKS, data.tasks);
      }
      
      if (data.scheduleItems) {
        this.setItem(STORAGE_KEYS.SCHEDULE_ITEMS, data.scheduleItems);
      }
      
      if (data.settings) {
        this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const localStorageManager = new LocalStorageManager();
