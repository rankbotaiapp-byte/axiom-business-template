import { createBrowserClient } from "@supabase/ssr";

import { supabasePublishableKey, supabaseUrl } from "./env";
import type { Database } from "@/types/database";

export function createBrowserSupabase() {
  return createBrowserClient<Database>(supabaseUrl(), supabasePublishableKey());
}
