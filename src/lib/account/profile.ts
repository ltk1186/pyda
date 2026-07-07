import { buildAccountProfileSummary } from "@/lib/account/core";
import { createClient } from "@/lib/supabase/server";

export async function getAccountProfile(userId: string) {
  const supabase = await createClient();
  const [{ data: profile, error }, { data: userData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (error) {
    throw new Error(`Failed to load account profile: ${error.message}`);
  }

  return buildAccountProfileSummary({
    profileDisplayName: profile?.display_name ?? null,
    profileAvatarUrl: profile?.avatar_url ?? null,
    metadata: userData.user?.user_metadata ?? null,
  });
}
