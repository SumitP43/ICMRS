import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to retrieve environment variable across Vite (client) and Node (server)
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  'https://wadcvbuubqkrgrmyxcgn.supabase.co';

const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  'sb_publishable_IMEkQ7Q0k6ZUe8RUxJbYYA_GKn8GWc-';

/**
 * Browser / Client-side Supabase client for Vite + React
 */
export const createClient = (): SupabaseClient => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

// Ready-to-use singleton client instance
export const supabase = createClient();
export default supabase;
