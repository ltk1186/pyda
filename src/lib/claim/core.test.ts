import { describe, expect, it } from "vitest";
import {
  canGenerateClaimLink,
  canUserClaimCreator,
  claimIntentClearCookieOptions,
  claimIntentCookieOptions,
  claimResumePath,
  buildClaimSuccessPayload,
  buildClaimUpdateMatch,
  claimExpiresAt,
  generateClaimToken,
  getClaimLoginNextPath,
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
        status: "published",
        now: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isClaimLinkUsable({
        claimExpiresAt: "2026-07-07T00:00:00.000Z",
        ownerUserId: "user-id",
        status: "published",
        now: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("rejects archived creator claim links", () => {
    expect(
      isClaimLinkUsable({
        claimExpiresAt: "2026-07-07T00:00:00.000Z",
        ownerUserId: null,
        status: "archived",
        now: new Date("2026-07-06T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("blocks archived creator claim link generation", () => {
    expect(canGenerateClaimLink({ ownerUserId: null, status: "published" })).toBe(
      true,
    );
    expect(canGenerateClaimLink({ ownerUserId: null, status: "archived" })).toBe(
      false,
    );
    expect(
      canGenerateClaimLink({ ownerUserId: "user-id", status: "published" }),
    ).toBe(false);
  });

  it("blocks users that already have a creator connection", () => {
    expect(canUserClaimCreator({ connectedCreatorCount: 0 })).toBe(true);
    expect(canUserClaimCreator({ connectedCreatorCount: 1 })).toBe(false);
  });

  it("uses claim resume for OAuth next without exposing raw claim tokens", () => {
    const rawToken = "raw-token";

    expect(getClaimLoginNextPath()).toBe(claimResumePath);
    expect(getClaimLoginNextPath()).not.toContain(rawToken);
  });

  it("builds a short-lived HttpOnly claim intent cookie", () => {
    expect(claimIntentCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  });

  it("clears claim intent cookie after resume success or invalid intent", () => {
    expect(claimIntentClearCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
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
