/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Resolve Vite client environment variables
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://vdvfjedjqmetxacwanqa.supabase.co';

const supabasePublishableKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  '';

if (!supabasePublishableKey) {
  console.warn(
    '[Supabase] Warning: VITE_SUPABASE_PUBLISHABLE_KEY is not set. Supabase client will fail requests until key is provided.'
  );
}

/**
 * Public client-side Supabase client.
 * Strictly uses publishable/anon key only. NEVER use service_role key here.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'icmrs_supabase_auth_token',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
