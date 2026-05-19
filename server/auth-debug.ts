// Debug endpoint to diagnose authentication issues
// Remove this in production!

import type { Express } from "express";
import { isDatabaseAvailable } from "./db";
import { storage } from "./storage";

export function setupAuthDebug(app: Express) {
  // GET /api/debug/auth-status - Check if database is available
  app.get("/api/debug/auth-status", async (req, res) => {
    try {
      const dbAvailable = isDatabaseAvailable();
      
      res.json({
        status: "ok",
        database: {
          available: dbAvailable,
          message: dbAvailable ? "Database connected" : "Database NOT connected"
        },
        session: {
          hasSession: !!req.session,
          userId: req.session?.userId || null,
          username: req.session?.username || null
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_SET: !!process.env.DATABASE_URL
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/debug/test-user-lookup - Test if we can find a user
  app.post("/api/debug/test-user-lookup", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "username is required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.json({
          found: false,
          message: `No user found with username: ${username}`
        });
      }

      res.json({
        found: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hasPassword: !!user.password
        }
      });
    } catch (error) {
      res.status(500).json({
        error: "Database query failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/debug/all-users - List all users (DEBUG ONLY!)
  app.get("/api/debug/all-users", async (req, res) => {
    try {
      // WARNING: This is dangerous in production!
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "This endpoint is disabled in production" });
      }

      const db = require("./db").db;
      if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
      }

      const allUsers = await db.select().from(require("@shared/schema").users);
      res.json({
        count: allUsers.length,
        users: allUsers.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email
        }))
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
