import "server-only";

import { createClient } from "@supabase/supabase-js";
import { readSupabaseAdminEnv } from "./env";

export function createAdminClient() {
  const env = readSupabaseAdminEnv();

  return createClient(env.url, env.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
