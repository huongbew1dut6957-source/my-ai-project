import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let publicClient: ReturnType<typeof createClient> | null = null;

export function getSupabasePublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return publicClient;
}
