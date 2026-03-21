import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseUrl = rawSupabaseUrl?.trim();
const supabaseAnonKey = rawSupabaseAnonKey?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabaseFetch: typeof fetch = async (input, init = {}) => {
  const normalizedHeaders = new Headers(init.headers ?? {});
  if (!normalizedHeaders.has('apikey')) {
    normalizedHeaders.set('apikey', supabaseAnonKey);
  }
  if (!normalizedHeaders.has('Authorization')) {
    normalizedHeaders.set('Authorization', `Bearer ${supabaseAnonKey}`);
  }

  return fetch(input, {
    ...init,
    headers: normalizedHeaders,
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
    headers: {
      apikey: supabaseAnonKey,
    },
  },
});
