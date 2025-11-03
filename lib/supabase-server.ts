import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-access-token');

  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authCookie
        ? { Authorization: `Bearer ${authCookie.value}` }
        : {},
    },
  });

  return client;
}
