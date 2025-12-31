import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    getLogger().warn('Supabase credentials not found in environment variables');
    return null;
  }

  return createClient(url, key);
}
