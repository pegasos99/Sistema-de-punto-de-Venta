import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable de entorno requerida: ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '127.0.0.1',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  supabaseUrl: required('SUPABASE_URL'),
  supabasePublishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  databaseUrl: required('DATABASE_URL'),
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT debe ser un puerto válido');
}
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

export const supabaseAuth = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
