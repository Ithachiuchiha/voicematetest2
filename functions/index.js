import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';

// Import your existing server routes
const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage for Firebase Functions
class MemStorage {
  constructor() {
    this.diaryEntries = new Map();
    this.tasks = new Map();
    this.scheduleItems = new Map();
    this.currentDiaryId = 1;
    this.currentTaskId = 1;
    this.currentScheduleId = 1;
  }

  async getDiaryEntriesByDate(date) {
    return Array.from(this.diaryEntries.values())
      .filter(entry => entry.date === date)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createDiaryEntry(entry) {
    const id = this.currentDiaryId++;
    const newEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };
    this.diaryEntries.set(id, newEntry);
    return newEntry;
  }

  async deleteDiaryEntry(id) {
    this.diaryEntries.delete(id);
  }

  async getAllTasks() {
    return Array.from(this.tasks.values());
  }

  async createTask(task) {
    const id = this.currentTaskId++;
    const newTask = {
      ...task,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id, updates) {
    const existingTask = this.tasks.get(id);
    if (!existingTask) throw new Error('Task not found');
    
    const updatedTask = { ...existingTask, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id) {
    this.tasks.delete(id);
  }

  async getAllScheduleItems() {
    return Array.from(this.scheduleItems.values());
  }

  async createScheduleItem(item) {
    const id = this.currentScheduleId++;
    const newItem = {
      ...item,
      id,
    };
    this.scheduleItems.set(id, newItem);
    return newItem;
  }

  async updateScheduleItem(id, updates) {
    const existingItem = this.scheduleItems.get(id);
    if (!existingItem) throw new Error('Schedule item not found');
    
    const updatedItem = { ...existingItem, ...updates };
    this.scheduleItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteScheduleItem(id) {
    this.scheduleItems.delete(id);
  }
}

const storage = new MemStorage();

// Diary routes
app.get('/api/diary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entries = await storage.getDiaryEntriesByDate(date);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

app.post('/api/diary', async (req, res) => {
  try {
    const newEntry = await storage.createDiaryEntry(req.body);
    res.json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diary entry' });
  }
});

app.delete('/api/diary/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteDiaryEntry(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

// Task routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = await storage.createTask(req.body);
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTask = await storage.updateTask(id, req.body);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Schedule routes
app.get('/api/schedule', async (req, res) => {
  try {
    const items = await storage.getAllScheduleItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule items' });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const newItem = await storage.createScheduleItem(req.body);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedule item' });
  }
});

app.patch('/api/schedule/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedItem = await storage.updateScheduleItem(id, req.body);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule item' });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteScheduleItem(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule item' });
  }
});

export const api = onRequest(app);