import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiaryEntrySchema, insertTaskSchema, insertScheduleItemSchema, signUpSchema, signInSchema, forgotPasswordSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import {
  apiLimiter,
  authLimiter,
  voiceLimiter,
  sanitizeInput,
  validatePasswordStrength,
  checkAccountLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  logSecurityEvent,
  sanitizeError,
  hashPassword,
  verifyPassword
} from "./security";

const SessionStore = MemoryStore(session);

// ── Session type — userId is now a UUID string ────────────────────────────────
declare module 'express-session' {
  interface SessionData {
    userId?: string;   // ← was number, now UUID string
    username?: string;
  }
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(session({
    store: new SessionStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || 'voice-mate-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    }
  }));

  // ── Auth routes ─────────────────────────────────────────────────────────────

  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const data = signUpSchema.parse(req.body);
      const sanitizedUsername = sanitizeInput(data.username);
      const sanitizedEmail = sanitizeInput(data.email);

      const passwordStrength = validatePasswordStrength(data.password);
      if (!passwordStrength.isValid) {
        return res.status(400).json({ error: "Password does not meet security requirements", feedback: passwordStrength.feedback });
      }

      const existingUser = await storage.getUserByUsername(sanitizedUsername);
      if (existingUser) return res.status(400).json({ error: "Username already exists" });

      const existingEmail = await storage.getUserByEmail(sanitizedEmail);
      if (existingEmail) return res.status(400).json({ error: "Email already exists" });

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({ username: sanitizedUsername, email: sanitizedEmail, password: hashedPassword });

      req.session.userId = user.id;       // ← UUID string
      req.session.username = user.username;

      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.post("/api/auth/signin", authLimiter, async (req, res) => {
    try {
      const data = signInSchema.parse(req.body);
      const sanitizedUsername = sanitizeInput(data.username);

      if (checkAccountLockout(sanitizedUsername)) {
        return res.status(423).json({ error: "Account temporarily locked due to multiple failed attempts" });
      }

      const user = await storage.getUserByUsername(sanitizedUsername);
      if (!user) {
        recordFailedAttempt(sanitizedUsername);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isValid = await verifyPassword(data.password, user.password);
      if (!isValid) {
        recordFailedAttempt(sanitizedUsername);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      clearFailedAttempts(sanitizedUsername);
      req.session.userId = user.id;       // ← UUID string
      req.session.username = user.username;

      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.email !== data.email) {
        return res.status(404).json({ error: "User not found with provided username and email" });
      }
      const newPassword = `${data.username}@${data.email.substring(0, 2)}`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password reset successful", newPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to sign out" });
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    res.json({ user: { id: req.session.userId, username: req.session.username } });
  });

  app.use("/api", apiLimiter);

  // ── Diary routes ────────────────────────────────────────────────────────────

  app.get("/api/diary/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const userId = req.session.userId!;
      const entries = await storage.getDiaryEntriesByDate(userId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diary entries" });
    }
  });

  app.post("/api/diary", requireAuth, voiceLimiter, async (req, res) => {
    try {
      const entry = insertDiaryEntrySchema.parse(req.body);
      const sanitizedEntry = { ...entry, content: sanitizeInput(entry.content) };
      const userId = req.session.userId!;
      const newEntry = await storage.createDiaryEntry(userId, sanitizedEntry);
      res.json(newEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid entry data", details: error.errors });
      } else {
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.delete("/api/diary/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;          // ← was parseInt, now plain string UUID
      const userId = req.session.userId!;
      await storage.deleteDiaryEntry(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete diary entry" });
    }
  });

  // ── Task routes ─────────────────────────────────────────────────────────────

  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const tasks = await storage.getAllTasks(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", requireAuth, voiceLimiter, async (req, res) => {
    try {
      const task = insertTaskSchema.parse(req.body);
      const sanitizedTask = {
        ...task,
        title: sanitizeInput(task.title),
        description: task.description ? sanitizeInput(task.description) : undefined
      };
      const userId = req.session.userId!;
      const newTask = await storage.createTask(userId, sanitizedTask);
      res.json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;          // ← was parseInt, now plain string UUID
      const userId = req.session.userId!;
      const updatedTask = await storage.updateTask(userId, id, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;          // ← was parseInt, now plain string UUID
      const userId = req.session.userId!;
      await storage.deleteTask(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ── Schedule routes ─────────────────────────────────────────────────────────

  app.get("/api/schedule", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const items = await storage.getAllScheduleItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule items" });
    }
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const item = insertScheduleItemSchema.parse(req.body);
      const userId = req.session.userId!;
      const newItem = await storage.createScheduleItem(userId, item);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid schedule item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create schedule item" });
      }
    }
  });

  app.patch("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;          // ← was parseInt, now plain string UUID
      const userId = req.session.userId!;
      const updatedItem = await storage.updateScheduleItem(userId, id, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule item" });
    }
  });

  app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;          // ← was parseInt, now plain string UUID
      const userId = req.session.userId!;
      await storage.deleteScheduleItem(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
