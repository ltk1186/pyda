import { describe, expect, it } from "vitest";
import { readSupabasePublicEnv } from "./env";

describe("readSupabasePublicEnv", () => {
  it("returns the configured Supabase public environment", () => {
    expect(
      readSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
  });

  it("throws when required values are missing", () => {
    expect(() => readSupabasePublicEnv({})).toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  });
});
