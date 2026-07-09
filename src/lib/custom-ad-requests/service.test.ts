import { describe, expect, it, vi } from "vitest";
import type { CustomAdRequestInput } from "./core";
import { submitCustomAdRequestWithDependencies } from "./service";

const request: CustomAdRequestInput = {
  advertisedItem: "제주 애월의 작은 카페",
  requestDetails: "제주 여행 유튜버가 영상 안에서 30초 정도 소개",
  creatorPreferences: null,
  budgetRange: "100k_300k",
  desiredTiming: "within_1_month",
  contactMethod: "kakao",
  phone: "01012345678",
  privacyConsent: true,
};

describe("submitCustomAdRequestWithDependencies", () => {
  it("does not roll back a persisted request when Telegram fails", async () => {
    const insert = vi.fn(async () => ({ id: "custom-request-id" }));
    const notify = vi.fn(async () => {
      throw new Error("telegram failed");
    });

    const result = await submitCustomAdRequestWithDependencies({
      request,
      userId: null,
      insert,
      notify,
    });

    expect(result).toEqual({ ok: true, id: "custom-request-id" });
    expect(insert).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledOnce();
  });

  it("returns a user-facing failure when insert fails", async () => {
    const result = await submitCustomAdRequestWithDependencies({
      request,
      userId: "user-id",
      insert: async () => {
        throw new Error("insert failed");
      },
      notify: vi.fn(),
    });

    expect(result.ok).toBe(false);
  });
});
