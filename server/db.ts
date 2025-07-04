import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Only initialize database connection if DATABASE_URL is available
// This allows the build process to complete without a database connection
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Guard function to ensure database is initialized
export function getDb() {
  if (!db) {
    throw new Error("Database connection not initialized. DATABASE_URL must be set.");
  }
  return db;
}

export { pool, db };