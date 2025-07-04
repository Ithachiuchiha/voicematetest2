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
  // Validate Supabase configuration first
  validateConfig();
  
  const config = getAppConfig();
  
  if (config.supabase) {
    try {
      console.log('[DB] Connecting to Supabase...');
      
      // Create Supabase connection pool
      pool = new Pool({ 
        connectionString: config.supabase.url,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      
      db = drizzle({ client: pool, schema });
      
      // Test the Supabase connection
      console.log('[DB] Testing Supabase connection...');
      await testDatabaseConnection();
      
      console.log('[DB] ✅ Supabase connected successfully');
    } catch (error) {
      console.error('[DB] ❌ Failed to connect to Supabase:', error);
      console.error('[DB] Please check:');
      console.error('[DB] 1. Your Supabase DATABASE_URL is correct');
      console.error('[DB] 2. Your Supabase project is active');
      console.error('[DB] 3. Network connectivity to Supabase');
      
      // In development, continue without database
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DB] ⚠️  Continuing without Supabase in development mode');
        pool = null;
        db = null;
      } else {
        throw new Error(`Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else {
    console.warn('[DB] ⚠️  No Supabase configuration - app will run without persistent storage');
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