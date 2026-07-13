import { describe, expect, it } from "vitest";
import {
  clearCreatorOnboardingDraft,
  creatorOnboardingDraftKey,
  parseCreatorOnboardingDraft,
  readCreatorOnboardingDraft,
  serializeCreatorOnboardingDraft,
  validateCreatorOnboardingDraft,
  writeCreatorOnboardingDraft,
  type CreatorOnboardingDraft,
} from "./onboarding-draft";

const validDraft: CreatorOnboardingDraft = {
  step: 3,
  displayName: "제주한바퀴",
  bio: "제주의 작은 공간을 소개합니다.",
  youtubeName: "제주한바퀴 YouTube",
  youtubeUrl: "https://youtube.com/@jeju",
  youtubeAudienceSize: "12000",
  instagramName: "",
  instagramUrl: "",
  instagramAudienceSize: "",
  selectedPlatform: "YouTube",
  inventoryType: "new_content",
  optionKeys: ["coupon_code", "dedicated_link"],
  placementFeeManwon: "10",
  productionFeeManwon: "20",
  placementFeeTouched: true,
  productionFeeTouched: true,
  turnaroundDays: "14",
  maintenanceDays: "14",
  mentionSeconds: "30",
  storyCount: "1",
};

describe("creator onboarding browser draft", () => {
  it("round-trips every serializable onboarding value", () => {
    expect(
      parseCreatorOnboardingDraft(
        serializeCreatorOnboardingDraft(validDraft),
      ),
    ).toEqual(validDraft);
  });

  it("preserves platform, inventory, options, prices, and touched state", () => {
    const parsed = parseCreatorOnboardingDraft(
      serializeCreatorOnboardingDraft(validDraft),
    );

    expect(parsed).toMatchObject({
      selectedPlatform: "YouTube",
      inventoryType: "new_content",
      optionKeys: ["coupon_code", "dedicated_link"],
      placementFeeManwon: "10",
      productionFeeManwon: "20",
      placementFeeTouched: true,
      productionFeeTouched: true,
      step: 3,
    });
  });

  it("ignores corrupt JSON and drafts from another schema version", () => {
    expect(parseCreatorOnboardingDraft("not-json")).toBeNull();
    expect(
      parseCreatorOnboardingDraft(
        JSON.stringify({ version: 2, draft: validDraft }),
      ),
    ).toBeNull();
  });

  it("uses the existing onboarding validation before OAuth", () => {
    expect(validateCreatorOnboardingDraft(validDraft).ok).toBe(true);

    const invalid = validateCreatorOnboardingDraft({
      ...validDraft,
      displayName: "",
    });

    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.errors.displayName).toBeTruthy();
    }
  });

  it("reads, writes, and clears only the versioned session key", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(writeCreatorOnboardingDraft(storage, validDraft)).toBe(true);
    expect(values.has(creatorOnboardingDraftKey)).toBe(true);
    expect(readCreatorOnboardingDraft(storage)).toEqual(validDraft);
    expect(clearCreatorOnboardingDraft(storage)).toBe(true);
    expect(readCreatorOnboardingDraft(storage)).toBeNull();
  });

  it("fails safely when browser storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readCreatorOnboardingDraft(storage)).toBeNull();
    expect(writeCreatorOnboardingDraft(storage, validDraft)).toBe(false);
    expect(clearCreatorOnboardingDraft(storage)).toBe(false);
  });
});
