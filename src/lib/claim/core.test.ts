import { describe, expect, it } from "vitest";
import {
  buildClaimSuccessPayload,
  buildClaimUpdateMatch,
  claimExpiresAt,
  generateClaimToken,
  hashClaimToken,
  isClaimLinkUsable,
} from "./core";

describe("claim token core", () => {
  it("hashes raw tokens without storing the raw value", () => {
    const raw = "raw-token";
    const hash = hashClaimToken(raw);

    expect(hash).not.toBe(raw);
    expect(hashClaimToken(raw)).toBe(hash);
  });

  it("creates high-entropy URL-safe tokens", () => {
    const token = generateClaimToken();

    expect(token.length).toBeGreaterThan(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("sets claim expiry exactly 14 days later", () => {
    expect(claimExpiresAt(new Date("2026-07-06T00:00:00.000Z")).toISOString()).toBe(
      "2026-07-20T00:00:00.000Z",
    );
  });

  it("regenerate produces a different hash structure", () => {
    const first = hashClaimToken(generateClaimToken());
    const second = hashClaimToken(generateClaimToken());

    expect(second).not.toBe(first);
  });

  it("rejects expired and already claimed creator links", () => {
    expect(
      isClaimLinkUsable({
        claimExpiresAt: "2026-07-05T00:00:00.000Z",
        ownerUserId: null,
        now: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isClaimLinkUsable({
        claimExpiresAt: "2026-07-07T00:00:00.000Z",
        ownerUserId: "user-id",
        now: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("builds conditional claim update match", () => {
    expect(
      buildClaimUpdateMatch({
        creatorId: "creator-id",
        tokenHash: "token-hash",
      }),
    ).toEqual({
      id: "creator-id",
      owner_user_id: null,
      claim_token_hash: "token-hash",
    });
  });

  it("clears claim fields without setting onboarded_at on success", () => {
    const payload = buildClaimSuccessPayload({
      nowIso: "2026-07-06T00:00:00.000Z",
      userId: "user-id",
    });

    expect(payload).toEqual({
      owner_user_id: "user-id",
      claimed_at: "2026-07-06T00:00:00.000Z",
      claim_token_hash: null,
      claim_expires_at: null,
    });
    expect("onboarded_at" in payload).toBe(false);
  });
});
