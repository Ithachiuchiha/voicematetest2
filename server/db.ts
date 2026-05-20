import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from "ws";
import * as schema from "@shared/schema";
import { getAppConfig, validateConfig } from "./config";

if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
} else {
  neonConfig.webSocketConstructor = WebSocket;
}
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

async function initializeDatabase() {
  validateConfig();
  const config = getAppConfig();

  if (!config.supabase) {
    console.warn('[DB] ⚠️  No Supabase config — running without persistent storage');
    return;
  }

  // ── Drizzle (data queries) ────────────────────────────────────────────────
  try {
    console.log('[DB] Connecting to Supabase PostgreSQL via Drizzle...');
    pool = new Pool({
      connectionString: config.supabase.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    db = drizzle({ client: pool, schema });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[DB] ✅ Drizzle connected');
  } catch (error) {
    console.error('[DB] ❌ Drizzle connection failed:', error);
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(`DB connection failed: ${error instanceof Error ? error.message : error}`);
    }
    pool = null;
    db = null;
  }

  // ── Supabase Admin client (auth operations) ───────────────────────────────
  _supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  console.log('[DB] ✅ Supabase Admin client ready');
}

initializeDatabase();

export function getDb() {
  if (!db) throw new Error("Drizzle not initialised. Check DATABASE_URL.");
  return db;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) throw new Error("Supabase Admin not initialised. Check SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.");
  return _supabaseAdmin;
}

export function isDatabaseAvailable(): boolean {
  return db !== null;
}

export { pool, db };
