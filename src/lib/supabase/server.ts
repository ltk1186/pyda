import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabasePublicEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const env = readSupabasePublicEnv();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Route Handlers and Server Actions can.
        }
      },
    },
  });
}
