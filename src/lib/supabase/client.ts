import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicEnv } from "./env";

export function createClient() {
  const env = readSupabasePublicEnv();

  return createBrowserClient(env.url, env.publishableKey);
}
