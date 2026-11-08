import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Supabase client for the driver app.
 *
 * The URL and anon key are the project's *public* credentials — the anon key
 * is designed to ship inside client apps and is safe to commit; all access is
 * gated by Row-Level Security in the database. Override per environment with
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY if you prefer.
 */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://vebdnwggtknmgvkdlpss.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmRud2dndGtubWd2a2RscHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMzc1MTcsImV4cCI6MjEwOTcxMzUxN30.ZXIbZqcNWq743uDRAIRxIfLPqqDMbHaKxwvHbzozkLs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection in a native app.
    detectSessionInUrl: false,
  },
});
