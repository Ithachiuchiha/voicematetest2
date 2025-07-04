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
  // Only check for Supabase DATABASE_URL
  const supabaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl) {
    console.warn('[CONFIG] No Supabase DATABASE_URL found');
    console.warn('[CONFIG] Please set DATABASE_URL environment variable with your Supabase connection string');
    return null;
  }

  if (!supabaseUrl.includes('supabase.com') && !supabaseUrl.includes('pooler.supabase')) {
    console.warn('[CONFIG] DATABASE_URL does not appear to be a Supabase URL');
    console.warn('[CONFIG] Expected format: postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres');
  }

  console.log(`[CONFIG] Supabase URL configured: ${supabaseUrl.substring(0, 35)}...`);
  
  return {
    url: supabaseUrl
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

// Validate Supabase configuration on startup
export function validateConfig(): void {
  const config = getAppConfig();
  
  if (!config.supabase) {
    console.error('[CONFIG] ❌ Supabase not configured!');
    console.error('[CONFIG] To connect to Supabase:');
    console.error('[CONFIG] 1. Get your DATABASE_URL from Supabase project → Settings → Database');
    console.error('[CONFIG] 2. Set environment variable: DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres');
    console.error('[CONFIG] 3. Restart the application');
    
    if (config.nodeEnv === 'production') {
      throw new Error('Supabase configuration required in production');
    }
  } else {
    console.log('[CONFIG] ✅ Supabase configured and ready');
  }
  
  console.log(`[CONFIG] ✅ Server port: ${config.port}`);
  console.log(`[CONFIG] ✅ Environment: ${config.nodeEnv}`);
}