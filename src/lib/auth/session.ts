import { createClient } from "@/lib/supabase/server";
import { readSupabasePublicEnv } from "@/lib/supabase/env";

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
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
