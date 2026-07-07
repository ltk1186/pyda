import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appCreatorPath = join(process.cwd(), "src/app/creator");

describe("creator route layout", () => {
  it("keeps onboarding routes outside the management layout", () => {
    expect(existsSync(join(appCreatorPath, "layout.tsx"))).toBe(false);
    expect(existsSync(join(appCreatorPath, "start/page.tsx"))).toBe(true);
    expect(existsSync(join(appCreatorPath, "onboarding/page.tsx"))).toBe(true);
    expect(
      existsSync(join(appCreatorPath, "onboarding/complete/page.tsx")),
    ).toBe(true);
  });

  it("keeps creator management routes inside the management route group", () => {
    const managePath = join(appCreatorPath, "(manage)");

    expect(existsSync(join(managePath, "layout.tsx"))).toBe(true);
    expect(existsSync(join(managePath, "page.tsx"))).toBe(true);
    expect(existsSync(join(managePath, "profile/page.tsx"))).toBe(true);
    expect(existsSync(join(managePath, "listings/page.tsx"))).toBe(true);
    expect(existsSync(join(managePath, "listings/new/page.tsx"))).toBe(true);
    expect(existsSync(join(managePath, "listings/[id]/edit/page.tsx"))).toBe(
      true,
    );
  });
});
