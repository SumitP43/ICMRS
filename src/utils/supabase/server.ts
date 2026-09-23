import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to retrieve environment variable across Node and Vite
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return '';
};

const supabaseUrl =
  getEnvVar('SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  'https://wadcvbuubqkrgrmyxcgn.supabase.co';

const supabaseKey =
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  'sb_publishable_IMEkQ7Q0k6ZUe8RUxJbYYA_GKn8GWc-';

/**
 * Server-side Supabase client for Express / Node.js
 * Optionally pass user auth token (e.g. from Authorization Bearer header)
 */
export const createClient = (accessToken?: string): SupabaseClient => {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: accessToken.startsWith('Bearer ')
              ? accessToken
              : `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
};

export const supabaseServer = createClient();
export default supabaseServer;
