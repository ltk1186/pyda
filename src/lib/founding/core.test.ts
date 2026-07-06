import { describe, expect, it } from "vitest";
import {
  buildFoundingApprovalMatch,
  buildFoundingApprovalPayload,
  evaluateFoundingEligibility,
  getEffectivePublicListingCount,
  parseFoundingProgramStart,
} from "./core";

const configuredProgram = parseFoundingProgramStart("2026-08-01T00:00:00+09:00");

describe("Founding program config", () => {
  it("accepts ISO datetimes with timezone", () => {
    const result = parseFoundingProgramStart("2026-08-01T00:00:00+09:00");

    expect(result.configured).toBe(true);
    if (!result.configured) {
      return;
    }

    expect(result.startAt.toISOString()).toBe("2026-07-31T15:00:00.000Z");
  });

  it("rejects timezone-less datetimes", () => {
    expect(parseFoundingProgramStart("2026-08-01T00:00:00")).toEqual({
      configured: false,
      reason: "invalid",
    });
  });

  it("handles missing and invalid config without defaults", () => {
    expect(parseFoundingProgramStart(undefined)).toEqual({
      configured: false,
      reason: "missing",
    });
    expect(parseFoundingProgramStart("not-a-date")).toEqual({
      configured: false,
      reason: "invalid",
    });
  });

  it("sets the end exactly 100 days after start", () => {
    const result = parseFoundingProgramStart("2026-08-01T00:00:00+09:00");

    expect(result.configured).toBe(true);
    if (!result.configured) {
      return;
    }

    expect(result.endAt.getTime() - result.startAt.getTime()).toBe(
      100 * 24 * 60 * 60 * 1000,
    );
  });
});

describe("Founding eligibility", () => {
  function evaluate(overrides: Partial<Parameters<typeof evaluateFoundingEligibility>[0]> = {}) {
    return evaluateFoundingEligibility({
      program: configuredProgram,
      onboardedAt: "2026-08-01T00:00:00+09:00",
      creatorStatus: "published",
      isSample: false,
      effectivePublicListingCount: 1,
      isFounding: false,
      ...overrides,
    });
  }

  it("rejects missing onboarded_at", () => {
    expect(evaluate({ onboardedAt: null }).eligibleForApproval).toBe(false);
  });

  it("rejects onboarding before the program start", () => {
    expect(
      evaluate({ onboardedAt: "2026-07-31T23:59:59+09:00" }).withinProgramWindow,
    ).toBe(false);
  });

  it("accepts onboarding exactly at the start", () => {
    expect(
      evaluate({ onboardedAt: "2026-08-01T00:00:00+09:00" }).withinProgramWindow,
    ).toBe(true);
  });

  it("accepts onboarding just before the end", () => {
    expect(
      evaluate({ onboardedAt: "2026-11-08T23:59:59+09:00" }).withinProgramWindow,
    ).toBe(true);
  });

  it("rejects onboarding exactly at the end", () => {
    expect(
      evaluate({ onboardedAt: "2026-11-09T00:00:00+09:00" }).withinProgramWindow,
    ).toBe(false);
  });

  it("requires at least one effective public listing", () => {
    expect(evaluate({ effectivePublicListingCount: 0 }).eligibleForApproval).toBe(
      false,
    );
  });

  it("uses marketplace public listing conditions", () => {
    expect(
      getEffectivePublicListingCount({
        creatorStatus: "hidden",
        publishedListingCount: 1,
      }),
    ).toBe(0);
    expect(
      getEffectivePublicListingCount({
        creatorStatus: "published",
        publishedListingCount: 1,
      }),
    ).toBe(1);
  });

  it("rejects sample creators", () => {
    expect(evaluate({ isSample: true }).eligibleForApproval).toBe(false);
  });

  it("does not allow re-approval for existing Founding creators", () => {
    const result = evaluate({ isFounding: true });

    expect(result.alreadyFounding).toBe(true);
    expect(result.eligibleForApproval).toBe(false);
  });
});

describe("Founding approval", () => {
  it("builds approval payload with only Founding fields", () => {
    const payload = buildFoundingApprovalPayload({
      nowIso: "2026-07-06T00:00:00.000Z",
    });

    expect(payload).toEqual({
      is_founding: true,
      founding_granted_at: "2026-07-06T00:00:00.000Z",
    });
    expect("onboarded_at" in payload).toBe(false);
  });

  it("uses CAS match with existing is_founding false", () => {
    expect(buildFoundingApprovalMatch({ creatorId: "creator-id" })).toEqual({
      id: "creator-id",
      is_founding: false,
    });
  });
});
