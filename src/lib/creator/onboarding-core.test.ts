import { describe, expect, it } from "vitest";
import {
  applyRecommendedOnboardingPriceValues,
  buildCreatorOnboardingCreatorPayload,
  buildCreatorOnboardingListingPayload,
  buildGeneratedCreatorSlug,
  buildGeneratedListingSlug,
  calculateOnboardingTotalPrice,
  getOnboardingAdSlotDefinition,
  getOnboardingErrorStep,
  getOnboardingSlotSelection,
  getRecommendedOnboardingPrice,
  parseOnboardingManwonToKrw,
  validateCreatorOnboardingInput,
  type OnboardingAdSlot,
} from "./onboarding-core";

const baseInput = {
  adSlot: "youtube_video_mention",
  displayName: "제주한바퀴",
  youtubeName: "제주한바퀴",
  youtubeUrl: "https://youtube.com/@jeju",
  youtubeAudienceSize: "1000",
  instagramName: "",
  instagramUrl: "",
  instagramAudienceSize: "",
  selectedPlatform: "YouTube",
  bio: "제주 여행 콘텐츠",
  inventoryType: "new_content",
  optionKeys: [],
  placementFeeManwon: "10",
  productionFeeManwon: "20",
  turnaroundDays: "14",
  maintenanceDays: "",
  mentionSeconds: "30",
  storyCount: "",
};

describe("creator onboarding ad slots", () => {
  it("defines the five user-facing ad slots", () => {
    const slots: OnboardingAdSlot[] = [
      "youtube_video_mention",
      "youtube_pinned_comment",
      "youtube_description_top",
      "instagram_reel_mention",
      "instagram_profile_or_highlight",
    ];

    expect(slots.map((slot) => getOnboardingAdSlotDefinition(slot).title)).toEqual([
      "YouTube 영상 속 짧은 소개",
      "YouTube 기존 영상 고정댓글",
      "YouTube 기존 영상 설명란 상단",
      "Instagram 릴스 속 짧은 소개",
      "Instagram 프로필 링크 또는 하이라이트",
    ]);
  });

  it("maps every slot to existing database fields", () => {
    expect(
      getOnboardingSlotSelection({ adSlot: "youtube_video_mention" }),
    ).toEqual({ platform: "YouTube", inventoryType: "new_content", optionKeys: [] });
    expect(
      getOnboardingSlotSelection({ adSlot: "youtube_pinned_comment" }),
    ).toEqual({
      platform: "YouTube",
      inventoryType: "existing_traffic",
      optionKeys: ["pinned_comment"],
    });
    expect(
      getOnboardingSlotSelection({ adSlot: "youtube_description_top" }),
    ).toEqual({
      platform: "YouTube",
      inventoryType: "existing_traffic",
      optionKeys: ["description_top"],
    });
    expect(
      getOnboardingSlotSelection({ adSlot: "instagram_reel_mention" }),
    ).toEqual({ platform: "Instagram", inventoryType: "new_content", optionKeys: [] });
    expect(
      getOnboardingSlotSelection({
        adSlot: "instagram_profile_or_highlight",
        instagramPlacement: "highlight",
      }),
    ).toEqual({
      platform: "Instagram",
      inventoryType: "existing_traffic",
      optionKeys: ["highlight"],
    });
  });
});

describe("creator onboarding validation and payloads", () => {
  it("accepts a YouTube mention and converts manwon prices to KRW", () => {
    const result = validateCreatorOnboardingInput(baseInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.adSlot).toBe("youtube_video_mention");
    expect(result.data.channelProfiles.youtube?.name).toBe("제주한바퀴");
    expect(result.data.mentionSeconds).toBe(30);
    expect(result.data.placementFeeKrw).toBe(100000);
    expect(result.data.productionFeeKrw).toBe(200000);
    expect(calculateOnboardingTotalPrice(result.data)).toBe(300000);
  });

  it("accepts an Instagram reel and requires only Instagram channel fields", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      adSlot: "instagram_reel_mention",
      selectedPlatform: "Instagram",
      instagramName: "today.jeju",
      instagramUrl: "https://instagram.com/today.jeju",
      instagramAudienceSize: "2000",
      inventoryType: "new_content",
      youtubeName: "stale",
      youtubeUrl: "not-a-url",
      youtubeAudienceSize: "bad",
      mentionSeconds: "",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.channelProfiles).toEqual({
      instagram: {
        name: "today.jeju",
        url: "https://instagram.com/today.jeju",
        audienceSize: 2000,
      },
    });
  });

  it("rejects a partial selected channel with a clear field error", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      youtubeAudienceSize: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.youtubeAudienceSize).toBe(
        "YouTube 구독자 수를 입력해주세요.",
      );
    }
  });

  it("rejects client-tampered slot mappings", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      adSlot: "youtube_pinned_comment",
      inventoryType: "new_content",
      optionKeys: ["coupon_code"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.optionKeys).toBeTruthy();
      expect(result.errors.adSlot).toBeTruthy();
    }
  });

  it("stores each existing-content position and forces production fee to zero", () => {
    const cases = [
      ["youtube_pinned_comment", "pinned_comment"],
      ["youtube_description_top", "description_top"],
    ] as const;

    for (const [adSlot, optionKey] of cases) {
      const result = validateCreatorOnboardingInput({
        ...baseInput,
        adSlot,
        inventoryType: "existing_traffic",
        optionKeys: [optionKey],
        productionFeeManwon: "99",
        turnaroundDays: "",
        maintenanceDays: "10",
        mentionSeconds: "",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.data.optionKeys).toEqual([optionKey]);
      expect(result.data.productionFeeKrw).toBe(0);
      expect(result.data.maintenanceDays).toBe(10);
    }
  });

  it("stores exactly one Instagram profile placement", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      adSlot: "instagram_profile_or_highlight",
      selectedPlatform: "Instagram",
      inventoryType: "existing_traffic",
      optionKeys: ["highlight"],
      youtubeName: "",
      youtubeUrl: "",
      youtubeAudienceSize: "",
      instagramName: "today.jeju",
      instagramUrl: "https://instagram.com/today.jeju",
      instagramAudienceSize: "2000",
      productionFeeManwon: "0",
      turnaroundDays: "",
      maintenanceDays: "30",
      mentionSeconds: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.optionKeys).toEqual(["highlight"]);
  });

  it("rejects invalid maintenance days", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      adSlot: "youtube_pinned_comment",
      inventoryType: "existing_traffic",
      optionKeys: ["pinned_comment"],
      turnaroundDays: "",
      maintenanceDays: "0",
      mentionSeconds: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.maintenanceDays).toBeTruthy();
  });

  it("converts and bounds 0.5-manwon price input", () => {
    expect(parseOnboardingManwonToKrw("0.5")).toBe(5000);
    expect(parseOnboardingManwonToKrw("99")).toBe(990000);
    for (const value of ["0", "-1", "3.7", "99.5", "100"]) {
      const result = validateCreatorOnboardingInput({
        ...baseInput,
        placementFeeManwon: value,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.placementFeeManwon).toBeTruthy();
    }
  });

  it("keeps recommendations without overwriting manually edited prices", () => {
    expect(
      getRecommendedOnboardingPrice({
        platform: "YouTube",
        inventoryType: "new_content",
      }),
    ).toEqual({ placementFeeManwon: "10", productionFeeManwon: "20" });
    expect(
      applyRecommendedOnboardingPriceValues({
        currentPlacementFeeManwon: "77",
        currentProductionFeeManwon: "11",
        placementFeeTouched: true,
        productionFeeTouched: true,
        platform: "Instagram",
        inventoryType: "new_content",
      }),
    ).toEqual({ placementFeeManwon: "77", productionFeeManwon: "11" });
  });

  it("builds a one-channel creator and slot-specific listing payload", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      displayName: "공통활동명",
      youtubeName: "유튜브채널명",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const creator = buildCreatorOnboardingCreatorPayload({
      input: result.data,
      creatorId: "creator-id",
      ownerUserId: "user-id",
      creatorSlug: "creator-abc",
      nowIso: "2026-07-07T00:00:00.000Z",
    });
    const listing = buildCreatorOnboardingListingPayload({
      input: result.data,
      creatorId: "creator-id",
      listingId: "listing-id",
      listingSlug: "youtube-new-content-listing",
      imagePaths: [],
    });

    expect(creator.social_links).toEqual({ youtube: "https://youtube.com/@jeju" });
    expect(creator.channel_profiles).toEqual({
      youtube: {
        name: "유튜브채널명",
        url: "https://youtube.com/@jeju",
        audience_size: 1000,
      },
    });
    expect(listing).toMatchObject({
      title: "YouTube 영상 속 30초 소개",
      channel_name: "유튜브채널명",
      option_keys: [],
      mention_seconds: 30,
      status: "draft",
      is_sample: false,
      published_at: null,
    });
  });

  it("routes slot, channel, and price errors to the new steps", () => {
    expect(getOnboardingErrorStep({ adSlot: "missing" })).toBe(1);
    expect(getOnboardingErrorStep({ optionKeys: "bad" })).toBe(1);
    expect(getOnboardingErrorStep({ youtubeUrl: "missing" })).toBe(2);
    expect(getOnboardingErrorStep({ selectedPlatform: "missing" })).toBe(2);
    expect(getOnboardingErrorStep({ placementFeeManwon: "bad" })).toBe(3);
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
