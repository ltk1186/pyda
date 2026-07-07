import { describe, expect, it } from "vitest";
import {
  buildCreatorOnboardingCreatorPayload,
  buildCreatorOnboardingListingPayload,
  buildGeneratedCreatorSlug,
  buildGeneratedListingSlug,
  calculateOnboardingTotalPrice,
  getOnboardingTemplate,
  validateCreatorOnboardingInput,
  validateOnboardingOptions,
} from "./onboarding-core";

const baseInput = {
  displayName: "제주한바퀴",
  platform: "YouTube",
  channelUrl: "https://youtube.com/@jeju",
  audienceSize: "1000",
  bio: "제주 여행 콘텐츠",
  inventoryType: "new_content",
  optionKeys: ["coupon_code"],
  placementFeeKrw: "300000",
  productionFeeKrw: "100000",
  turnaroundDays: "14",
  sourceContentUrl: "",
  recent30dViews: "",
};

describe("creator onboarding templates", () => {
  it("maps all four platform and inventory combinations", () => {
    expect(getOnboardingTemplate("YouTube", "new_content")).toMatchObject({
      title: "YouTube 영상 내 15초 직접 소개 + 하단 CTA",
      adFormat: "15초 직접 소개 + 하단 CTA",
      baseDeliverables: [
        "영상 안에서 약 15초 직접 소개",
        "하단 CTA에 매장명, 혜택 또는 링크 표시",
      ],
    });
    expect(getOnboardingTemplate("Instagram", "new_content")).toMatchObject({
      title: "Instagram 릴스 방문 리뷰 1편",
      adFormat: "릴스 방문 리뷰 1편",
    });
    expect(getOnboardingTemplate("YouTube", "existing_traffic")).toMatchObject({
      title: "기존 YouTube 영상 고정댓글 + 설명란 광고",
      adFormat: "고정댓글 + 설명란 상단 광고",
    });
    expect(getOnboardingTemplate("Instagram", "existing_traffic")).toMatchObject({
      title: "Instagram 프로필 링크 30일",
      adFormat: "프로필 링크 광고",
    });
  });

  it("rejects options not allowed for the selected product", () => {
    expect(
      validateOnboardingOptions({
        platform: "YouTube",
        inventoryType: "existing_traffic",
        optionKeys: ["dedicated_link"],
      }),
    ).toBeTruthy();
  });
});

describe("creator onboarding validation and payloads", () => {
  it("validates YouTube new content and recalculates total price", () => {
    const result = validateCreatorOnboardingInput(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.productionFeeKrw).toBe(100000);
    expect(calculateOnboardingTotalPrice(result.data)).toBe(400000);
  });

  it("validates Instagram existing traffic with production fee fixed to zero", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      platform: "Instagram",
      channelUrl: "https://instagram.com/today.jeju",
      inventoryType: "existing_traffic",
      optionKeys: ["coupon_code"],
      productionFeeKrw: "999999",
      turnaroundDays: "",
      sourceContentUrl: "https://instagram.com/p/example",
      recent30dViews: "1200",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.productionFeeKrw).toBe(0);
    expect(result.data.recent30dViews).toBe(1200);
  });

  it("rejects platform mismatched URLs, negative numbers, and unknown options", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      platform: "YouTube",
      channelUrl: "https://instagram.com/not-youtube",
      audienceSize: "-1",
      optionKeys: ["unknown_option"],
      placementFeeKrw: "0",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.channelUrl).toBeTruthy();
      expect(result.errors.audienceSize).toBeTruthy();
      expect(result.errors.placementFeeKrw).toBeTruthy();
      expect(result.errors.optionKeys).toBeTruthy();
    }
  });

  it("requires existing traffic source content and recent views", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      inventoryType: "existing_traffic",
      sourceContentUrl: "",
      recent30dViews: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.sourceContentUrl).toBeTruthy();
      expect(result.errors.recent30dViews).toBeTruthy();
    }
  });

  it("builds direct onboarding creator payload with protected fields server-decided", () => {
    const result = validateCreatorOnboardingInput(baseInput);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildCreatorOnboardingCreatorPayload({
      input: result.data,
      creatorId: "creator-id",
      ownerUserId: "user-id",
      creatorSlug: "creator-abc",
      nowIso: "2026-07-07T00:00:00.000Z",
    });

    expect(payload).toMatchObject({
      id: "creator-id",
      owner_user_id: "user-id",
      slug: "creator-abc",
      status: "draft",
      is_sample: false,
      onboarded_at: "2026-07-07T00:00:00.000Z",
      is_founding: false,
      founding_granted_at: null,
      claim_token_hash: null,
    });
  });

  it("builds draft first listing payload and ignores client total price", () => {
    const result = validateCreatorOnboardingInput(baseInput);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildCreatorOnboardingListingPayload({
      input: result.data,
      creatorId: "creator-id",
      listingId: "listing-id",
      listingSlug: "youtube-new-content-listing",
      imagePaths: ["creators/creator-id/listings/listing-id/a.webp"],
    });

    expect(payload).toMatchObject({
      creator_id: "creator-id",
      status: "draft",
      is_sample: false,
      published_at: null,
      inventory_type: "new_content",
      placement_fee_krw: 300000,
      production_fee_krw: 100000,
      price_krw: 400000,
      turnaround_days: 14,
    });
    expect(payload.deliverables).toContain("쿠폰코드 포함");
  });

  it("generates safe slugs without user-provided slug input", () => {
    expect(buildGeneratedCreatorSlug("ABC-123_456")).toBe("creator-abc-123-456");
    expect(
      buildGeneratedListingSlug({
        platform: "Instagram",
        inventoryType: "existing_traffic",
        randomId: "LISTING_123",
      }),
    ).toBe("instagram-existing-traffic-listing-123");
  });
});
