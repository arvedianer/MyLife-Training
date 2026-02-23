import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder so createClient doesn't throw when env vars are not set.
// Actual auth calls are guarded by checking NEXT_PUBLIC_SUPABASE_URL at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabase;
