import { describe, expect, it } from "vitest";
import { FOUNDING_BENEFIT_BPS, STANDARD_PLATFORM_FEE_BPS } from "./constants";

describe("business constants", () => {
  it("uses basis points for platform fee and Founding benefit", () => {
    expect(STANDARD_PLATFORM_FEE_BPS).toBe(1500);
    expect(FOUNDING_BENEFIT_BPS).toBe(500);
  });
});
