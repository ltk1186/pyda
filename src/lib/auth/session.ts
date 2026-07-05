import { createClient } from "@/lib/supabase/server";
import { readSupabasePublicEnv } from "@/lib/supabase/env";

export type CurrentUser = {
  id: string;
  email: string | null;
};

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) {
      return null;
    }

    return {
      id: data.claims.sub,
      email: typeof data.claims.email === "string" ? data.claims.email : null,
    } satisfies CurrentUser;
  } catch {
    return null;
  }
}

function hasSupabaseEnv() {
  try {
    readSupabasePublicEnv();
    return true;
  } catch {
    return false;
  }
}
