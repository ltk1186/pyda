import { describe, expect, it } from "vitest";
import { isAdminProfile } from "./auth-core";

describe("isAdminProfile", () => {
  it("accepts admin profiles", () => {
    expect(isAdminProfile({ is_admin: true })).toBe(true);
  });

  it("rejects non-admin and missing profiles", () => {
    expect(isAdminProfile({ is_admin: false })).toBe(false);
    expect(isAdminProfile(null)).toBe(false);
  });
});
