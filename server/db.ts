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
  // Validate configuration first
  validateConfig();
  
  const config = getAppConfig();
  
  if (config.database) {
    try {
      console.log(`[DB] Initializing ${config.database.type} connection...`);
      
      // Create connection pool with retry logic
      pool = new Pool({ 
        connectionString: config.database.url,
        // Add connection pool options for better reliability
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      
      db = drizzle({ client: pool, schema });
      
      // Test the connection
      console.log('[DB] Testing database connection...');
      await testDatabaseConnection();
      
      console.log('[DB] ✅ Database connection established and tested');
    } catch (error) {
      console.error('[DB] ❌ Failed to initialize database:', error);
      console.error('[DB] This might be due to:');
      console.error('[DB] 1. Invalid DATABASE_URL');
      console.error('[DB] 2. Network connectivity issues');
      console.error('[DB] 3. Database server unavailable');
      
      // In development, continue without database
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DB] ⚠️  Continuing without database in development mode');
        pool = null;
        db = null;
      } else {
        throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else {
    console.warn('[DB] ⚠️  Running without database - data will not persist');
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