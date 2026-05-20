// Environment configuration for Voice Mate

export interface SupabaseConfig {
  databaseUrl: string;
  url: string;
  serviceRoleKey: string;
}

export interface AppConfig {
  supabase: SupabaseConfig | null;
  port: number;
  nodeEnv: string;
  sessionSecret: string;
}

function getSupabaseConfig(): SupabaseConfig | null {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!databaseUrl) {
    console.warn('[CONFIG] No DATABASE_URL found — set your Supabase connection string');
    return null;
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[CONFIG] ❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    console.error('[CONFIG] Find them in: Supabase Dashboard → Project Settings → API');
    return null;
  }
  if (!databaseUrl.startsWith('postgresql://')) {
    console.error('[CONFIG] ❌ DATABASE_URL must start with postgresql://');
    return null;
  }

  console.log('[CONFIG] ✅ Supabase fully configured');
  return { databaseUrl, url: supabaseUrl, serviceRoleKey };
}

export function getAppConfig(): AppConfig {
  return {
    supabase: getSupabaseConfig(),
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'voice-mate-dev-secret-change-in-production',
  };
}

export function validateConfig(): void {
  const config = getAppConfig();
  if (!config.supabase) {
    console.error('[CONFIG] Required env vars: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    if (config.nodeEnv === 'production') {
      throw new Error('Supabase configuration required in production');
    }
  }
  console.log(`[CONFIG] ✅ Port: ${config.port} | Env: ${config.nodeEnv}`);
}
