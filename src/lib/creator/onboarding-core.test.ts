import { describe, expect, it } from "vitest";
import {
  applyRecommendedOnboardingPriceValues,
  buildCreatorOnboardingCreatorPayload,
  buildCreatorOnboardingListingPayload,
  buildGeneratedCreatorSlug,
  buildGeneratedListingSlug,
  calculateOnboardingTotalPrice,
  getOnboardingErrorStep,
  getRecommendedOnboardingPrice,
  getOnboardingTemplate,
  inferOnboardingSelectedPlatform,
  parseOnboardingManwonToKrw,
  validateCreatorOnboardingInput,
  validateOnboardingOptions,
} from "./onboarding-core";

const baseInput = {
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
  optionKeys: ["coupon_code"],
  placementFeeManwon: "30",
  productionFeeManwon: "10",
  turnaroundDays: "14",
  maintenanceDays: "",
  mentionSeconds: "30",
  storyCount: "",
};

describe("creator onboarding templates", () => {
  it("maps all four platform and inventory combinations with plain-language copy", () => {
    expect(getOnboardingTemplate("YouTube", "new_content")).toMatchObject({
      heading: "새 영상 안에서 직접 소개하기",
      baseDeliverables: [
        "영상 안에서 크리에이터가 직접 소개",
        "매장명, 혜택 또는 링크를 화면에 표시",
      ],
      example: "제주 여행 영상 안에서 카페를 30초 소개",
    });
    expect(getOnboardingTemplate("Instagram", "new_content")).toMatchObject({
      heading: "새 릴스로 방문이나 사용 경험 소개하기",
    });
    expect(getOnboardingTemplate("YouTube", "existing_traffic")).toMatchObject({
      heading: "기존 영상에 광고 추가하기",
    });
    expect(getOnboardingTemplate("Instagram", "existing_traffic")).toMatchObject({
      heading: "기존 Instagram 계정에 광고 노출하기",
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
  it("accepts YouTube only and converts manwon prices to KRW", () => {
    const result = validateCreatorOnboardingInput(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.channelProfiles.youtube?.name).toBe("제주한바퀴");
    expect(result.data.placementFeeKrw).toBe(300000);
    expect(result.data.productionFeeKrw).toBe(100000);
    expect(calculateOnboardingTotalPrice(result.data)).toBe(400000);
  });

  it("converts 0.5 manwon to 5,000 KRW and 99 manwon to 990,000 KRW", () => {
    expect(parseOnboardingManwonToKrw("0.5")).toBe(5000);
    expect(parseOnboardingManwonToKrw("99")).toBe(990000);
  });

  it("accepts Instagram only", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      youtubeName: "",
      youtubeUrl: "",
      youtubeAudienceSize: "",
      instagramName: "today.jeju",
      instagramUrl: "https://instagram.com/today.jeju",
      instagramAudienceSize: "2000",
      selectedPlatform: "Instagram",
      inventoryType: "new_content",
      optionKeys: ["story_3"],
      storyCount: "2",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.channelProfiles.instagram?.name).toBe("today.jeju");
    expect(result.data.storyCount).toBe(2);
  });

  it("accepts both channels and preserves different channel names", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      instagramName: "today.jeju",
      instagramUrl: "https://instagram.com/today.jeju",
      instagramAudienceSize: "2000",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.channelProfiles.youtube?.name).toBe("제주한바퀴");
    expect(result.data.channelProfiles.instagram?.name).toBe("today.jeju");
  });

  it("allows empty step data during UI navigation but rejects final blank channels", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      youtubeName: "",
      youtubeUrl: "",
      youtubeAudienceSize: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.selectedPlatform).toBeTruthy();
    }
  });

  it("returns partial channel errors clearly", () => {
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

  it("does not require source URL or recent views for existing traffic", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      inventoryType: "existing_traffic",
      optionKeys: ["pinned_comment"],
      productionFeeManwon: "999",
      turnaroundDays: "",
      maintenanceDays: "10",
      mentionSeconds: "",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.productionFeeKrw).toBe(0);
    expect(result.data.maintenanceDays).toBe(10);
  });

  it("rejects invalid maintenance days", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      inventoryType: "existing_traffic",
      optionKeys: ["pinned_comment"],
      maintenanceDays: "0",
      mentionSeconds: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.maintenanceDays).toBeTruthy();
    }
  });

  it("rejects out-of-range or invalid manwon price inputs", () => {
    for (const value of ["0", "-1", "3.7", "99.5", "100"]) {
      const result = validateCreatorOnboardingInput({
        ...baseInput,
        placementFeeManwon: value,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.placementFeeManwon).toBeTruthy();
      }
    }
  });

  it("allows 0.5 manwon increments and recomputes total price", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      placementFeeManwon: "0.5",
      productionFeeManwon: "0.5",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.placementFeeKrw).toBe(5000);
    expect(result.data.productionFeeKrw).toBe(5000);
    expect(calculateOnboardingTotalPrice(result.data)).toBe(10000);
  });

  it("provides recommended prices by platform and product", () => {
    expect(
      getRecommendedOnboardingPrice({
        platform: "YouTube",
        inventoryType: "new_content",
      }),
    ).toEqual({ placementFeeManwon: "10", productionFeeManwon: "20" });
    expect(
      getRecommendedOnboardingPrice({
        platform: "Instagram",
        inventoryType: "existing_traffic",
      }),
    ).toEqual({ placementFeeManwon: "1", productionFeeManwon: "0" });
  });

  it("does not overwrite manually edited recommended prices", () => {
    expect(
      applyRecommendedOnboardingPriceValues({
        currentPlacementFeeManwon: "77",
        currentProductionFeeManwon: "11",
        placementFeeTouched: true,
        productionFeeTouched: true,
        platform: "Instagram",
        inventoryType: "new_content",
      }),
    ).toEqual({
      placementFeeManwon: "77",
      productionFeeManwon: "11",
    });
  });

  it("builds direct onboarding creator payload with channel profiles", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      instagramName: "today.jeju",
      instagramUrl: "https://instagram.com/today.jeju",
      instagramAudienceSize: "2000",
    });
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
      owner_user_id: "user-id",
      status: "draft",
      is_sample: false,
      onboarded_at: "2026-07-07T00:00:00.000Z",
      social_links: {
        youtube: "https://youtube.com/@jeju",
        instagram: "https://instagram.com/today.jeju",
      },
      channel_profiles: {
        youtube: {
          name: "제주한바퀴",
          url: "https://youtube.com/@jeju",
          audience_size: 1000,
        },
        instagram: {
          name: "today.jeju",
          url: "https://instagram.com/today.jeju",
          audience_size: 2000,
        },
      },
    });
  });

  it("builds first listing from the selected channel, not the creator display name", () => {
    const result = validateCreatorOnboardingInput({
      ...baseInput,
      displayName: "공통활동명",
      youtubeName: "유튜브채널명",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildCreatorOnboardingListingPayload({
      input: result.data,
      creatorId: "creator-id",
      listingId: "listing-id",
      listingSlug: "youtube-new-content-listing",
      imagePaths: [],
    });

    expect(payload).toMatchObject({
      channel_name: "유튜브채널명",
      price_krw: 400000,
      mention_seconds: 30,
      status: "draft",
      is_sample: false,
      published_at: null,
    });
    expect(payload.deliverables).toContain("영상 안에서 약 30초 직접 소개");
  });

  it("routes validation errors to the correct step", () => {
    expect(getOnboardingErrorStep({ youtubeUrl: "missing" })).toBe(1);
    expect(getOnboardingErrorStep({ selectedPlatform: "missing" })).toBe(2);
    expect(getOnboardingErrorStep({ optionKeys: "bad" })).toBe(2);
    expect(getOnboardingErrorStep({ placementFeeManwon: "bad" })).toBe(3);
  });

  it("infers the selected platform from completed channel data", () => {
    expect(
      inferOnboardingSelectedPlatform({
        current: "YouTube",
        youtubeComplete: false,
        instagramComplete: true,
      }),
    ).toBe("Instagram");
    expect(
      inferOnboardingSelectedPlatform({
        current: "Instagram",
        youtubeComplete: true,
        instagramComplete: false,
      }),
    ).toBe("YouTube");
    expect(
      inferOnboardingSelectedPlatform({
        current: "Instagram",
        youtubeComplete: true,
        instagramComplete: true,
      }),
    ).toBe("Instagram");
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
