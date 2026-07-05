export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

export type SupabaseAdminEnv = SupabasePublicEnv & {
  secretKey: string;
};

type SupabaseEnvSource = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
};

export function readSupabasePublicEnv(
  env: SupabaseEnvSource = process.env as Record<string, string | undefined>,
): SupabasePublicEnv {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}

export function readSupabaseAdminEnv(
  env: SupabaseEnvSource = process.env as Record<string, string | undefined>,
): SupabaseAdminEnv {
  const publicEnv = readSupabasePublicEnv(env);
  const secretKey = env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY for server admin access.");
  }

  return { ...publicEnv, secretKey };
}
