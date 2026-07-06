import { describe, expect, it } from "vitest";
import {
  buildAvatarStorageObjectPath,
  buildCreatorListingInsertPayload,
  buildCreatorListingUpdatePayload,
  buildCreatorProfileUpdatePayload,
  buildOnboardingCompletePayload,
  canCreatorSelfManage,
  canCompleteCreatorOnboarding,
  canEditOwnedListing,
  creatorSelfManageBlockedMessage,
  getPreviousStorageAvatarToCleanup,
  validateAvatarFile,
  validateCreatorListingBase,
  validateCreatorProfileForm,
} from "./core";
import {
  assertSingleOwnedCreatorCount,
  buildOwnedCreatorLookupFilter,
} from "./owner-core";

describe("creator owner access helpers", () => {
  it("builds owner lookup from the current user id on the server", () => {
    expect(buildOwnedCreatorLookupFilter("user-id")).toEqual({
      owner_user_id: "user-id",
    });
  });

  it("handles zero connected creators", () => {
    expect(assertSingleOwnedCreatorCount(0)).toBe(false);
  });

  it("throws on multiple connected creators", () => {
    expect(() => assertSingleOwnedCreatorCount(2)).toThrow(
      "Multiple creator profiles",
    );
  });
});

describe("creator profile self-management", () => {
  it("rejects archived creator self-management before mutation", () => {
    expect(canCreatorSelfManage("archived")).toBe(false);
    expect(canCreatorSelfManage("published")).toBe(true);
    expect(creatorSelfManageBlockedMessage("archived")).toBe(
      "보관된 크리에이터는 자기 관리를 수정할 수 없습니다.",
    );
  });

  it("builds profile update payload without protected fields or status", () => {
    const result = validateCreatorProfileForm({
      displayName: "김제주",
      slug: "kim-jeju",
      bio: "제주 여행 크리에이터",
      youtube: "https://youtube.com/@jeju",
      instagram: "",
      blog: "",
      tiktok: "",
      status: "archived",
      owner_user_id: "attacker",
      is_founding: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildCreatorProfileUpdatePayload(result.data);

    expect(payload).toEqual({
      slug: "kim-jeju",
      display_name: "김제주",
      bio: "제주 여행 크리에이터",
      social_links: {
        youtube: "https://youtube.com/@jeju",
      },
    });
    expect("status" in payload).toBe(false);
    expect("owner_user_id" in payload).toBe(false);
    expect("onboarded_at" in payload).toBe(false);
  });

  it("keeps slug and social URL validation", () => {
    const result = validateCreatorProfileForm({
      displayName: "김제주",
      slug: "Bad Slug",
      youtube: "javascript:alert(1)",
      instagram: "/relative",
      blog: "not-url",
      tiktok: "ftp://example.com/@jeju",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.slug).toBeTruthy();
      expect(result.errors.youtube).toBeTruthy();
      expect(result.errors.instagram).toBeTruthy();
      expect(result.errors.blog).toBeTruthy();
      expect(result.errors.tiktok).toBeTruthy();
    }
  });
});

describe("creator listing self-management", () => {
  const input = {
    title: "영상 소개",
    slug: "youtube-intro",
    platform: "YouTube" as const,
    channelName: "제주채널",
    channelUrl: "https://youtube.com/@jeju",
    audienceSize: 1000,
    adFormat: "영상 내 30초 소개",
    description: "브랜드를 소개합니다.",
    deliverables: ["브랜드 소개"],
    priceKrw: 500000,
    status: "published" as const,
  };

  it("validates creator listing fields through shared listing rules", () => {
    const result = validateCreatorListingBase({
      title: "영상 소개",
      slug: "youtube-intro",
      platform: "YouTube",
      channelUrl: "https://youtube.com/@jeju",
      audienceSize: "1000",
      adFormat: "영상 내 30초 소개",
      deliverablesText: "브랜드 소개",
      priceKrw: "500000",
      status: "published",
      imageCount: 1,
    });

    expect(result.ok).toBe(true);
  });

  it("server decides creator_id and forces is_sample false on insert", () => {
    const payload = buildCreatorListingInsertPayload({
      input,
      creatorId: "server-creator-id",
      listingId: "listing-id",
      imagePaths: ["creators/server-creator-id/listings/listing-id/a.webp"],
      publishedAt: "2026-07-06T00:00:00.000Z",
    });

    expect(payload.creator_id).toBe("server-creator-id");
    expect(payload.is_sample).toBe(false);
  });

  it("does not allow creator_id or is_sample in creator listing update payload", () => {
    const payload = buildCreatorListingUpdatePayload({
      input,
      imagePaths: ["image.webp"],
      publishedAt: "2026-07-06T00:00:00.000Z",
    });

    expect("creator_id" in payload).toBe(false);
    expect("is_sample" in payload).toBe(false);
  });

  it("rejects editing another creator listing", () => {
    expect(
      canEditOwnedListing({
        ownerCreatorId: "creator-a",
        listingCreatorId: "creator-b",
      }),
    ).toBe(false);
  });

  it("keeps non-archived creator self-management available", () => {
    expect(canCreatorSelfManage("draft")).toBe(true);
    expect(canCreatorSelfManage("hidden")).toBe(true);
    expect(canCreatorSelfManage("published")).toBe(true);
  });
});

describe("creator avatar", () => {
  it("builds avatar storage paths under the creator avatar namespace", () => {
    expect(
      buildAvatarStorageObjectPath({
        creatorId: "creator-id",
        randomId: "random",
        extension: ".webp",
      }),
    ).toBe("creators/creator-id/avatar/random.webp");
  });

  it("allows only supported MIME types and 5MB files", () => {
    expect(validateAvatarFile(new File(["x"], "a.webp", { type: "image/webp" }))).toBeNull();
    expect(validateAvatarFile(new File(["x"], "a.gif", { type: "image/gif" }))).toBeTruthy();
    expect(
      validateAvatarFile(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.webp", {
          type: "image/webp",
        }),
      ),
    ).toBeTruthy();
  });

  it("cleans up only previous Storage avatars and never local assets", () => {
    expect(
      getPreviousStorageAvatarToCleanup({
        previousAvatarPath: "creators/a/avatar/old.webp",
        nextAvatarPath: "creators/a/avatar/new.webp",
      }),
    ).toBe("creators/a/avatar/old.webp");
    expect(
      getPreviousStorageAvatarToCleanup({
        previousAvatarPath: "/images/samples/avatar.svg",
        nextAvatarPath: null,
      }),
    ).toBeNull();
  });
});

describe("creator onboarding completion", () => {
  it("rejects onboarding completion with zero listings", () => {
    expect(
      canCompleteCreatorOnboarding({
        creatorStatus: "published",
        onboardedAt: null,
        nonArchivedListingCount: 0,
      }).ok,
    ).toBe(false);
  });

  it("rejects archived creators", () => {
    expect(
      canCompleteCreatorOnboarding({
        creatorStatus: "archived",
        onboardedAt: null,
        nonArchivedListingCount: 1,
      }).ok,
    ).toBe(false);
  });

  it("allows non-archived creators with at least one non-archived listing", () => {
    expect(
      canCompleteCreatorOnboarding({
        creatorStatus: "hidden",
        onboardedAt: null,
        nonArchivedListingCount: 1,
      }).ok,
    ).toBe(true);
  });

  it("builds onboarding completion payload with only onboarded_at", () => {
    expect(
      buildOnboardingCompletePayload({
        nowIso: "2026-07-06T00:00:00.000Z",
      }),
    ).toEqual({
      onboarded_at: "2026-07-06T00:00:00.000Z",
    });
  });

  it("rejects resetting already completed onboarding", () => {
    expect(
      canCompleteCreatorOnboarding({
        creatorStatus: "published",
        onboardedAt: "2026-07-06T00:00:00.000Z",
        nonArchivedListingCount: 1,
      }).ok,
    ).toBe(false);
  });
});
