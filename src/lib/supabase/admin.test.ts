import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Supabase admin client boundary", () => {
  it("keeps the secret key in a server-only module", () => {
    const adminSource = readFileSync("src/lib/supabase/admin.ts", "utf8");

    expect(adminSource).toContain('import "server-only"');
    expect(adminSource).toContain("readSupabaseAdminEnv");
  });

  it("does not import the admin client or secret key from client modules", () => {
    const clientSources = [
      "src/lib/supabase/client.ts",
      "src/components/admin/admin-request-forms.tsx",
      "src/components/requests/request-form.tsx",
    ].map((file) => readFileSync(file, "utf8"));

    for (const source of clientSources) {
      expect(source).not.toContain("SUPABASE_SECRET_KEY");
      expect(source).not.toContain("@/lib/supabase/admin");
      expect(source).not.toContain("createAdminClient");
    }
  });
});
