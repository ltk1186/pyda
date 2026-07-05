import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./redirect";

describe("sanitizeNextPath", () => {
  it("allows safe internal paths", () => {
    expect(sanitizeNextPath("/listings/sample?request=1")).toBe(
      "/listings/sample?request=1",
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeNextPath("//evil.com")).toBe("/");
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextPath("https://evil.com/listings/sample")).toBe("/");
  });

  it("falls back to root for invalid next values", () => {
    expect(sanitizeNextPath(undefined)).toBe("/");
    expect(sanitizeNextPath("not-a-path")).toBe("/");
    expect(sanitizeNextPath("%E0%A4%A")).toBe("/");
  });
});
