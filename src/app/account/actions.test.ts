import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("account actions", () => {
  it("signs out with the cookie-aware Supabase server client", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/account/actions.ts"),
      "utf8",
    );

    expect(source).toContain("createClient");
    expect(source).toContain("supabase.auth.signOut()");
    expect(source).toContain('redirect("/")');
    expect(source).not.toContain("createAdminClient");
  });
});
