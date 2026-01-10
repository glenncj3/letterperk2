import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '../services/Logger';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    getLogger().warn('Supabase credentials not found in environment variables');
    return null;
  }

  // Create and cache the client
  supabaseClient = createClient(url, key);
  return supabaseClient;
}
