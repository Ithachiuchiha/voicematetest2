// Environment configuration for Voice Mate
// Handles Supabase and other database connections

export interface DatabaseConfig {
  url: string;
  type: 'supabase' | 'neon' | 'postgres';
}

export interface AppConfig {
  database: DatabaseConfig | null;
  port: number;
  nodeEnv: string;
  sessionSecret: string;
}

function detectDatabaseType(url: string): 'supabase' | 'neon' | 'postgres' {
  if (url.includes('supabase.com')) return 'supabase';
  if (url.includes('neon.tech')) return 'neon';
  return 'postgres';
}

function getDatabaseConfig(): DatabaseConfig | null {
  // Check for database URL in order of priority
  const databaseUrl = 
    process.env.DATABASE_URL ||           // Standard environment variable
    process.env.SUPABASE_URL ||           // Supabase-specific
    process.env.SUPABASE_DATABASE_URL ||  // Alternative naming
    process.env.POSTGRES_URL ||           // PostgreSQL generic
    process.env.NEON_DATABASE_URL;        // Neon-specific

  if (!databaseUrl) {
    console.warn('[CONFIG] No database URL found in environment variables');
    console.warn('[CONFIG] Checked: DATABASE_URL, SUPABASE_URL, SUPABASE_DATABASE_URL, POSTGRES_URL, NEON_DATABASE_URL');
    return null;
  }

  const type = detectDatabaseType(databaseUrl);
  console.log(`[CONFIG] Found ${type} database: ${databaseUrl.substring(0, 30)}...`);
  
  return {
    url: databaseUrl,
    type
  };
}

export function getAppConfig(): AppConfig {
  const database = getDatabaseConfig();
  
  return {
    database,
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'voice-mate-dev-secret-change-in-production'
  };
}

// Validate configuration on startup
export function validateConfig(): void {
  const config = getAppConfig();
  
  if (!config.database) {
    console.error('[CONFIG] ❌ No database configured!');
    console.error('[CONFIG] To use Supabase:');
    console.error('[CONFIG] 1. Get your DATABASE_URL from Supabase project settings');
    console.error('[CONFIG] 2. Set it as environment variable: DATABASE_URL=postgresql://...');
    console.error('[CONFIG] 3. Restart the application');
    
    if (config.nodeEnv === 'production') {
      throw new Error('Database configuration required in production');
    }
  } else {
    console.log(`[CONFIG] ✅ Database configured: ${config.database.type}`);
  }
  
  console.log(`[CONFIG] ✅ Server port: ${config.port}`);
  console.log(`[CONFIG] ✅ Environment: ${config.nodeEnv}`);
}