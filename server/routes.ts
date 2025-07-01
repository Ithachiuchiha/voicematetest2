import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiaryEntrySchema, insertTaskSchema, insertScheduleItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Diary routes
  app.get("/api/diary/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entries = await storage.getDiaryEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diary entries" });
    }
  });

  app.post("/api/diary", async (req, res) => {
    try {
      const entry = insertDiaryEntrySchema.parse(req.body);
      const newEntry = await storage.createDiaryEntry(entry);
      res.json(newEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid entry data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create diary entry" });
      }
    }
  });

  app.delete("/api/diary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDiaryEntry(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete diary entry" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const task = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(task);
      res.json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedTask = await storage.updateTask(id, updates);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Schedule routes
  app.get("/api/schedule", async (req, res) => {
    try {
      const items = await storage.getAllScheduleItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule items" });
    }
  });

  app.post("/api/schedule", async (req, res) => {
    try {
      const item = insertScheduleItemSchema.parse(req.body);
      const newItem = await storage.createScheduleItem(item);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid schedule item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create schedule item" });
      }
    }
  });

  app.patch("/api/schedule/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedItem = await storage.updateScheduleItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule item" });
    }
  });

  app.delete("/api/schedule/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScheduleItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
