import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("browser Supabase client environment access", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/supabase/client.ts"), {
    encoding: "utf8",
  });

  it("directly references public env values for browser bundling", () => {
    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("does not use the server env helper or secret key in the browser client", () => {
    expect(source).not.toContain("readSupabasePublicEnv");
    expect(source).not.toContain("SUPABASE_SECRET_KEY");
  });
});
