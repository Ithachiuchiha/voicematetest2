import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { getAppConfig, validateConfig } from "./config";

neonConfig.webSocketConstructor = ws;

// Database connection state
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  // Validate configuration first
  validateConfig();
  
  const config = getAppConfig();
  
  if (config.database) {
    try {
      console.log(`[DB] Initializing ${config.database.type} connection...`);
      pool = new Pool({ connectionString: config.database.url });
      db = drizzle({ client: pool, schema });
      console.log('[DB] ✅ Database connection established');
    } catch (error) {
      console.error('[DB] ❌ Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    console.warn('[DB] ⚠️  Running without database - data will not persist');
  }
}

// Initialize database connection
initializeDatabase();

// Guard function to ensure database is initialized
export function getDb() {
  if (!db) {
    throw new Error("Database connection not initialized. Please set DATABASE_URL environment variable with your Supabase connection string.");
  }
  return db;
}

// Function to check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null;
}

export { pool, db };