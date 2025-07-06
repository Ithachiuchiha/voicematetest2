// Environment configuration for Voice Mate
// Supabase-only configuration

export interface SupabaseConfig {
  url: string;
}

export interface AppConfig {
  supabase: SupabaseConfig | null;
  port: number;
  nodeEnv: string;
  sessionSecret: string;
}

function getSupabaseConfig(): SupabaseConfig | null {
  // Use the working DATABASE_URL (Neon is PostgreSQL compatible)
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[CONFIG] No DATABASE_URL found');
    console.warn('[CONFIG] Please set DATABASE_URL environment variable');
    return null;
  }

  // Accept any PostgreSQL URL (Supabase, Neon, or other PostgreSQL providers)
  if (!databaseUrl.startsWith('postgresql://')) {
    console.warn('[CONFIG] DATABASE_URL must be a PostgreSQL connection string');
    console.warn('[CONFIG] Expected format: postgresql://user:password@host:port/database');
    return null;
  }

  // Determine the provider
  let provider = 'PostgreSQL';
  if (databaseUrl.includes('supabase.com') || databaseUrl.includes('pooler.supabase')) {
    provider = 'Supabase';
  } else if (databaseUrl.includes('neon.tech')) {
    provider = 'Neon';
  }

  console.log(`[CONFIG] ✅ Connected to ${provider} database`);
  console.log(`[CONFIG] Database URL: ${databaseUrl.substring(0, 35)}...`);
  
  return {
    url: databaseUrl
  };
}

export function getAppConfig(): AppConfig {
  const supabase = getSupabaseConfig();
  
  return {
    supabase,
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'voice-mate-dev-secret-change-in-production'
  };
}

// Validate database configuration on startup
export function validateConfig(): void {
  const config = getAppConfig();
  
  if (!config.supabase) {
    console.error('[CONFIG] ❌ Database not configured!');
    console.error('[CONFIG] To connect to a PostgreSQL database:');
    console.error('[CONFIG] 1. Get your DATABASE_URL from your database provider');
    console.error('[CONFIG] 2. Set environment variable: DATABASE_URL=postgresql://...');
    console.error('[CONFIG] 3. Restart the application');
    
    if (config.nodeEnv === 'production') {
      throw new Error('Database configuration required in production');
    }
  } else {
    console.log('[CONFIG] ✅ Database configured and ready');
  }
  
  console.log(`[CONFIG] ✅ Server port: ${config.port}`);
  console.log(`[CONFIG] ✅ Environment: ${config.nodeEnv}`);
}