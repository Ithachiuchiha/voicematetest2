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

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with enhanced security
  app.use(session({
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'voice-mate-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Force HTTPS in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict' // CSRF protection
    }
  }));
  // Authentication routes
  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const data = signUpSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(data.username);
      const sanitizedEmail = sanitizeInput(data.email);
      
      // Enhanced password validation
      const passwordStrength = validatePasswordStrength(data.password);
      if (!passwordStrength.isValid) {
        logSecurityEvent('WEAK_PASSWORD_ATTEMPT', { username: sanitizedUsername }, req);
        return res.status(400).json({ 
          error: "Password does not meet security requirements", 
          feedback: passwordStrength.feedback 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(sanitizedUsername);
      if (existingUser) {
        logSecurityEvent('DUPLICATE_USERNAME_ATTEMPT', { username: sanitizedUsername }, req);
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(sanitizedEmail);
      if (existingEmail) {
        logSecurityEvent('DUPLICATE_EMAIL_ATTEMPT', { email: sanitizedEmail }, req);
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password with enhanced security
      const hashedPassword = await hashPassword(data.password);
      
      // Create user
      const user = await storage.createUser({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword
      });

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      logSecurityEvent('USER_REGISTERED', { userId: user.id, username: user.username }, req);

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        console.error("Signup error:", error);
        logSecurityEvent('SIGNUP_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, req);
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.post("/api/auth/signin", authLimiter, async (req, res) => {
    try {
      const data = signInSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(data.username);
      
      // Check account lockout
      if (checkAccountLockout(sanitizedUsername)) {
        logSecurityEvent('ACCOUNT_LOCKED_ATTEMPT', { username: sanitizedUsername }, req);
        return res.status(423).json({ error: "Account temporarily locked due to multiple failed attempts" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(sanitizedUsername);
      if (!user) {
        recordFailedAttempt(sanitizedUsername);
        logSecurityEvent('INVALID_USERNAME_ATTEMPT', { username: sanitizedUsername }, req);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check password
      const isValid = await verifyPassword(data.password, user.password);
      if (!isValid) {
        recordFailedAttempt(sanitizedUsername);
        logSecurityEvent('INVALID_PASSWORD_ATTEMPT', { username: sanitizedUsername }, req);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Clear failed attempts on successful login
      clearFailedAttempts(sanitizedUsername);
      
      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      logSecurityEvent('USER_LOGGED_IN', { userId: user.id, username: user.username }, req);

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        console.error("Signin error:", error);
        logSecurityEvent('SIGNIN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, req);
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      
      // Find user by username and email
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.email !== data.email) {
        return res.status(404).json({ error: "User not found with provided username and email" });
      }

      // Generate new password: username + @ + first two letters of email
      const newPassword = `${data.username}@${data.email.substring(0, 2)}`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password (we need to add this method to storage)
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ 
        message: "Password reset successful", 
        newPassword 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to sign out" });
      }
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json({
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  });
  // Apply API rate limiting to all API routes
  app.use("/api", apiLimiter);

  // Diary routes
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
      
      // Sanitize content input
      const sanitizedEntry = {
        ...entry,
        content: sanitizeInput(entry.content)
      };
      
      const userId = req.session.userId!;
      const newEntry = await storage.createDiaryEntry(userId, sanitizedEntry);
      res.json(newEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid entry data", details: error.errors });
      } else {
        logSecurityEvent('DIARY_CREATE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, req);
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.delete("/api/diary/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      await storage.deleteDiaryEntry(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete diary entry" });
    }
  });

  // Task routes
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
      
      // Sanitize task inputs
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
        logSecurityEvent('TASK_CREATE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, req);
        res.status(500).json(sanitizeError(error));
      }
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const updates = req.body;
      const updatedTask = await storage.updateTask(userId, id, updates);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      await storage.deleteTask(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Schedule routes
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
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const updates = req.body;
      const updatedItem = await storage.updateScheduleItem(userId, id, updates);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule item" });
    }
  });

  app.delete("/api/schedule/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      await storage.deleteScheduleItem(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule item" });
    }
  });

  // Security status endpoint (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/security/status", (req, res) => {
      res.json({
        security: {
          sessionSecure: process.env.SESSION_SECRET !== 'voice-mate-secret-key-change-in-production',
          databaseConnected: true,
          corsEnabled: true,
          rateLimitingEnabled: true,
          inputSanitizationEnabled: true,
          securityHeadersEnabled: true,
          accountLockoutEnabled: true,
          auditLoggingEnabled: true,
          environment: process.env.NODE_ENV
        },
        message: "Security features active"
      });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
