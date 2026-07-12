import { describe, expect, it } from "vitest";
import {
  buildCustomAdRequestInsertPayload,
  parseCustomAdRequestFormData,
  sanitizeCustomAdSource,
  validateCustomAdRequestInput,
} from "./core";

const validInput = {
  advertisedItem: "제주 애월의 작은 카페",
  requestDetails: "제주 여행 유튜버가 영상 안에서 카페를 30초 정도 소개",
  creatorPreferences: "제주 여행 콘텐츠, YouTube",
  budgetRange: "100k_300k",
  desiredTiming: "within_1_month",
  contactMethod: "kakao",
  phone: "010-1234-5678",
  privacyConsent: true,
};

function validFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    advertisedItem: validInput.advertisedItem,
    requestDetails: validInput.requestDetails,
    creatorPreferences: validInput.creatorPreferences,
    budgetRange: validInput.budgetRange,
    desiredTiming: validInput.desiredTiming,
    contactMethod: validInput.contactMethod,
    phone: validInput.phone,
    privacyConsent: "on",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("custom ad request source tracking", () => {
  it.each([
    ["talktalk_stay", "talktalk_stay"],
    ["TalkTalk_Stay", "talktalk_stay"],
    [undefined, "homepage_concierge"],
    ["", "homepage_concierge"],
    ["  ", "homepage_concierge"],
    ["a".repeat(51), "homepage_concierge"],
    [" talktalk_stay ", "talktalk_stay"],
    ["flyer.jeju", "homepage_concierge"],
    ["src; drop table--", "homepage_concierge"],
    ["한글값", "homepage_concierge"],
    ["has space", "homepage_concierge"],
  ])("sanitizes %s to %s", (input, expected) => {
    expect(sanitizeCustomAdSource(input)).toBe(expected);
  });

  it("parses a valid source without affecting form validation", () => {
    const result = parseCustomAdRequestFormData(
      validFormData({ source: "talktalk_stay" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.source).toBe("talktalk_stay");
    }
  });

  it("defaults missing source without affecting form validation", () => {
    const formData = validFormData();
    formData.delete("source");

    const result = parseCustomAdRequestFormData(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.source).toBe("homepage_concierge");
    }
  });

  it("defaults polluted hidden source without showing a validation error", () => {
    const result = parseCustomAdRequestFormData(
      validFormData({ source: "<script>" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.source).toBe("homepage_concierge");
    }
  });
});

describe("custom ad request validation", () => {
  it("accepts a valid concierge demand request", () => {
    const result = validateCustomAdRequestInput(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.phone).toBe("01012345678");
      expect(result.data.budgetRange).toBe("100k_300k");
      expect(result.data.source).toBe("homepage_concierge");
    }
  });

  it("requires advertised item and request details", () => {
    const result = validateCustomAdRequestInput({
      ...validInput,
      advertisedItem: "",
      requestDetails: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.advertisedItem).toBeTruthy();
      expect(result.errors.requestDetails).toBeTruthy();
    }
  });

  it("validates budget and timing allow-lists", () => {
    const result = validateCustomAdRequestInput({
      ...validInput,
      budgetRange: "cheap",
      desiredTiming: "tomorrow",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.budgetRange).toBeTruthy();
      expect(result.errors.desiredTiming).toBeTruthy();
    }
  });

  it("allows only Kakao and phone contact methods", () => {
    expect(
      validateCustomAdRequestInput({
        ...validInput,
        contactMethod: "phone",
      }).ok,
    ).toBe(true);

    const result = validateCustomAdRequestInput({
      ...validInput,
      contactMethod: "email",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.contactMethod).toBeTruthy();
    }
  });

  it("requires a valid phone for both contact methods", () => {
    for (const contactMethod of ["kakao", "phone"]) {
      const result = validateCustomAdRequestInput({
        ...validInput,
        contactMethod,
        phone: "1234",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.phone).toBeTruthy();
      }
    }
  });

  it("validates max lengths", () => {
    const result = validateCustomAdRequestInput({
      ...validInput,
      advertisedItem: "가".repeat(101),
      requestDetails: "가".repeat(1501),
      creatorPreferences: "가".repeat(501),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.advertisedItem).toBeTruthy();
      expect(result.errors.requestDetails).toBeTruthy();
      expect(result.errors.creatorPreferences).toBeTruthy();
    }
  });

  it("requires privacy consent", () => {
    const result = validateCustomAdRequestInput({
      ...validInput,
      privacyConsent: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.privacyConsent).toBeTruthy();
    }
  });
});

describe("custom ad request insert payload", () => {
  it("stores anonymous requests with null user id", () => {
    const parsed = validateCustomAdRequestInput(validInput);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const payload = buildCustomAdRequestInsertPayload({
      request: parsed.data,
      userId: null,
    });

    expect(payload.user_id).toBeNull();
    expect(payload.status).toBe("submitted");
    expect(payload.source).toBe("homepage_concierge");
  });

  it("stores sanitized campaign source values", () => {
    const parsed = validateCustomAdRequestInput({
      ...validInput,
      source: "dm_insta_fnb",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const payload = buildCustomAdRequestInsertPayload({
      request: parsed.data,
      userId: null,
    });

    expect(payload.source).toBe("dm_insta_fnb");
  });

  it("stores logged-in requests with the server-derived user id", () => {
    const parsed = validateCustomAdRequestInput(validInput);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const payload = buildCustomAdRequestInsertPayload({
      request: parsed.data,
      userId: "user-id",
    });

    expect(payload.user_id).toBe("user-id");
  });
});
