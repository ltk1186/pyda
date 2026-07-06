import { readSupabasePublicEnv } from "@/lib/supabase/env";

export const publicMediaBucket = "public-media";

export function resolveImagePath(path: string) {
  if (path.startsWith("/")) {
    return path;
  }

  const env = readSupabasePublicEnv();
  return `${env.url}/storage/v1/object/public/${publicMediaBucket}/${path}`;
}
