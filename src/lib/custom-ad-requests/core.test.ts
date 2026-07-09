import { describe, expect, it } from "vitest";
import {
  buildCustomAdRequestInsertPayload,
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

describe("custom ad request validation", () => {
  it("accepts a valid concierge demand request", () => {
    const result = validateCustomAdRequestInput(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.phone).toBe("01012345678");
      expect(result.data.budgetRange).toBe("100k_300k");
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
