import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSupabaseAdmin } from "./db";
import {
  insertDiaryEntrySchema, insertTaskSchema, insertScheduleItemSchema,
  signUpSchema, signInSchema, forgotPasswordSchema,
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import {
  apiLimiter, authLimiter, voiceLimiter,
  sanitizeInput, validatePasswordStrength,
  checkAccountLockout, recordFailedAttempt, clearFailedAttempts,
  sanitizeError,
} from "./security";

const SessionStore = MemoryStore(session);

declare module 'express-session' {
  interface SessionData {
    userId?: string;    // auth.users UUID (= profiles.id)
    username?: string;
  }
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Authentication required' });
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
      sameSite: 'strict',
    },
  }));

  // ── Auth ─────────────────────────────────────────────────────────────────────

  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const data = signUpSchema.parse(req.body);
      const username = sanitizeInput(data.username);
      const email = sanitizeInput(data.email).toLowerCase();

      const pwCheck = validatePasswordStrength(data.password);
      if (!pwCheck.isValid) {
        return res.status(400).json({ error: "Weak password", feedback: pwCheck.feedback });
      }

      // Check username/email uniqueness before touching Supabase Auth
      const [existingUser, existingEmail] = await Promise.all([
        storage.getProfileByUsername(username),
        storage.getProfileByEmail(email),
      ]);
      if (existingUser) return res.status(400).json({ error: "Username already taken" });
      if (existingEmail) return res.status(400).json({ error: "Email already registered" });

      // Create user in Supabase Auth (this populates auth.users)
      const supabase = getSupabaseAdmin();
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,   // skip email verification — change to false if you want confirmation
      });
      if (authError) {
        console.error('[AUTH] Supabase createUser error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      // Mirror into public.profiles (same UUID)
      const profile = await storage.createProfile({
        id: authData.user.id,
        username,
        email,
      });

      req.session.userId = profile.id;
      req.session.username = profile.username;

      res.json({ user: { id: profile.id, username: profile.username, email: profile.email } });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json(sanitizeError(error));
    }
  });

  app.post("/api/auth/signin", authLimiter, async (req, res) => {
    try {
      const data = signInSchema.parse(req.body);
      const username = sanitizeInput(data.username);

      if (checkAccountLockout(username)) {
        return res.status(423).json({ error: "Account temporarily locked — too many failed attempts" });
      }

      // Lookup email via profiles (username → email)
      const profile = await storage.getProfileByUsername(username);
      if (!profile) {
        recordFailedAttempt(username);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Validate credentials via Supabase Auth
      const supabase = getSupabaseAdmin();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: data.password,
      });
      if (authError || !authData.user) {
        recordFailedAttempt(username);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      clearFailedAttempts(username);
      req.session.userId = profile.id;
      req.session.username = profile.username;

      res.json({ user: { id: profile.id, username: profile.username, email: profile.email } });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json(sanitizeError(error));
    }
  });

  // Sends a Supabase password-reset email — no weak temp passwords
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const supabase = getSupabaseAdmin();
      // Fire-and-forget: always return success to avoid email enumeration
      await supabase.auth.resetPasswordForEmail(data.email.toLowerCase());
      res.json({ message: "If that email is registered, a reset link has been sent." });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to send reset email" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to sign out" });
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    // Return fresh profile data (username may have been updated)
    const profile = await storage.getProfile(req.session.userId);
    if (!profile) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Profile not found" });
    }
    res.json({ user: { id: profile.id, username: profile.username, email: profile.email } });
  });

  app.use("/api", apiLimiter);

  // ── Diary ─────────────────────────────────────────────────────────────────

  app.get("/api/diary/:date", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getDiaryEntriesByDate(req.session.userId!, req.params.date);
      res.json(entries);
    } catch { res.status(500).json({ error: "Failed to fetch diary entries" }); }
  });

  app.post("/api/diary", requireAuth, voiceLimiter, async (req, res) => {
    try {
      const entry = insertDiaryEntrySchema.parse(req.body);
      const sanitized = { ...entry, content: sanitizeInput(entry.content) };
      res.json(await storage.createDiaryEntry(req.session.userId!, sanitized));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid entry data", details: error.errors });
      res.status(500).json(sanitizeError(error));
    }
  });

  app.delete("/api/diary/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteDiaryEntry(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete diary entry" }); }
  });

  // ── Tasks ─────────────────────────────────────────────────────────────────

  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAllTasks(req.session.userId!));
    } catch { res.status(500).json({ error: "Failed to fetch tasks" }); }
  });

  app.post("/api/tasks", requireAuth, voiceLimiter, async (req, res) => {
    try {
      const task = insertTaskSchema.parse(req.body);
      const sanitized = {
        ...task,
        title: sanitizeInput(task.title),
        description: task.description ? sanitizeInput(task.description) : undefined,
      };
      res.json(await storage.createTask(req.session.userId!, sanitized));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid task data", details: error.errors });
      res.status(500).json(sanitizeError(error));
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      res.json(await storage.updateTask(req.session.userId!, req.params.id, req.body));
    } catch { res.status(500).json({ error: "Failed to update task" }); }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTask(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete task" }); }
  });

  // ── Schedule ──────────────────────────────────────────────────────────────

  app.get("/api/schedule", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAllScheduleItems(req.session.userId!));
    } catch { res.status(500).json({ error: "Failed to fetch schedule items" }); }
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const item = insertScheduleItemSchema.parse(req.body);
      res.json(await storage.createScheduleItem(req.session.userId!, item));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid schedule item", details: error.errors });
      res.status(500).json({ error: "Failed to create schedule item" });
    }
  });

  app.patch("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      res.json(await storage.updateScheduleItem(req.session.userId!, req.params.id, req.body));
    } catch { res.status(500).json({ error: "Failed to update schedule item" }); }
  });

  app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteScheduleItem(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to delete schedule item" }); }
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getUnreadNotifications(req.session.userId!));
    } catch { res.status(500).json({ error: "Failed to fetch notifications" }); }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed to mark notification" }); }
  });

  return createServer(app);
}
