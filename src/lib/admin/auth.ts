import "server-only";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdminProfile } from "./auth-core";

export type AdminUser = CurrentUser;

export { isAdminProfile };

export async function requireAdmin(nextPath: string): Promise<AdminUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !isAdminProfile(data)) {
    notFound();
  }

  return user;
}
