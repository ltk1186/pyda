import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("server action upload request limit", () => {
  it("sets the Server Action body size limit to 16mb", () => {
    const source = readFileSync("next.config.mjs", "utf8");

    expect(source).toContain("serverActions");
    expect(source).toContain('bodySizeLimit: "16mb"');
  });
});
