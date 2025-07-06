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
  // Only accept Supabase DATABASE_URL
  const supabaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl) {
    console.warn('[CONFIG] No Supabase DATABASE_URL found');
    console.warn('[CONFIG] Please set DATABASE_URL with your Supabase connection string');
    return null;
  }

  // Validate it's a proper PostgreSQL connection string
  if (!supabaseUrl.startsWith('postgresql://')) {
    console.error('[CONFIG] ❌ DATABASE_URL must start with postgresql://');
    console.error('[CONFIG] Expected: postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres');
    console.error('[CONFIG] You provided:', supabaseUrl.substring(0, 30) + '...');
    return null;
  }

  // Validate it's actually a Supabase URL
  if (!supabaseUrl.includes('supabase.com') && !supabaseUrl.includes('pooler.supabase')) {
    console.warn('[CONFIG] ⚠️  URL does not appear to be from Supabase');
    console.warn('[CONFIG] Expected format: postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres');
    console.warn('[CONFIG] Current URL pattern:', supabaseUrl.substring(0, 50) + '...');
    console.warn('[CONFIG] Proceeding anyway...');
  }

  console.log('[CONFIG] ✅ Supabase URL configured');
  console.log(`[CONFIG] Connection: ${supabaseUrl.substring(0, 35)}...`);
  
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
    console.error('[CONFIG] 1. Go to your Supabase project dashboard');
    console.error('[CONFIG] 2. Settings → Database → Connection string → Connection pooling');
    console.error('[CONFIG] 3. Copy the PostgreSQL URL (starts with postgresql://)');
    console.error('[CONFIG] 4. Replace [YOUR-PASSWORD] with your actual password');
    console.error('[CONFIG] 5. Set DATABASE_URL environment variable');
    console.error('[CONFIG] 6. Restart the application');
    
    if (config.nodeEnv === 'production') {
      throw new Error('Supabase configuration required in production');
    }
  } else {
    console.log('[CONFIG] ✅ Supabase configured and ready');
  }
  
  console.log(`[CONFIG] ✅ Server port: ${config.port}`);
  console.log(`[CONFIG] ✅ Environment: ${config.nodeEnv}`);
}