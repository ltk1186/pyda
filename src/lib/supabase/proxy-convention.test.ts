import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("request interception convention", () => {
  it("uses middleware.ts for OpenNext Cloudflare compatibility", () => {
    expect(existsSync(join(process.cwd(), "middleware.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "proxy.ts"))).toBe(false);
  });
});
