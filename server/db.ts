import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { getAppConfig, validateConfig } from "./config";

// Configure WebSocket for different environments
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
} else {
  // In browser-like environments, use the global WebSocket
  neonConfig.webSocketConstructor = WebSocket;
}

// Configure connection options for better reliability
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Database connection state
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

async function initializeDatabase() {
  // Validate database configuration first
  validateConfig();
  
  const config = getAppConfig();
  
  if (config.supabase) {
    try {
      console.log('[DB] Connecting to PostgreSQL database...');
      
      // Create database connection pool
      pool = new Pool({ 
        connectionString: config.supabase.url,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      
      db = drizzle({ client: pool, schema });
      
      // Test the database connection
      console.log('[DB] Testing database connection...');
      await testDatabaseConnection();
      
      console.log('[DB] ✅ Database connected successfully');
    } catch (error) {
      console.error('[DB] ❌ Failed to connect to database:', error);
      console.error('[DB] Please check:');
      console.error('[DB] 1. Your DATABASE_URL is correct');
      console.error('[DB] 2. Your database is active and accessible');
      console.error('[DB] 3. Network connectivity');
      
      // In development, continue without database
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DB] ⚠️  Continuing without database in development mode');
        pool = null;
        db = null;
      } else {
        throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else {
    console.warn('[DB] ⚠️  No database configuration - app will run without persistent storage');
  }
}

async function testDatabaseConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error) {
    throw new Error(`Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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