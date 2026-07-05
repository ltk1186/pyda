import { describe, expect, it } from "vitest";
import {
  canAdminTransitionRequest,
  formatAdminRequestStatus,
  getAllowedAdminRequestTransitions,
  parsePositiveKrw,
} from "./request-status";

describe("admin request status", () => {
  it("formats admin status labels in Korean", () => {
    expect(formatAdminRequestStatus("submitted")).toBe("신규 요청");
    expect(formatAdminRequestStatus("checking")).toBe("확인 중");
    expect(formatAdminRequestStatus("payment_ready")).toBe("결제 가능");
  });

  it("allows only the current manual admin transitions", () => {
    expect(getAllowedAdminRequestTransitions("submitted")).toEqual([
      "checking",
      "declined",
      "cancelled",
    ]);
    expect(getAllowedAdminRequestTransitions("checking")).toEqual([
      "payment_ready",
      "declined",
      "cancelled",
    ]);
    expect(canAdminTransitionRequest("submitted", "checking")).toBe(true);
  });

  it("rejects disallowed manual transitions", () => {
    expect(canAdminTransitionRequest("submitted", "completed")).toBe(false);
    expect(canAdminTransitionRequest("payment_ready", "paid")).toBe(false);
    expect(getAllowedAdminRequestTransitions("paid")).toEqual([]);
  });

  it("requires a positive integer price for payment_ready", () => {
    expect(parsePositiveKrw("500000")).toBe(500000);
    expect(parsePositiveKrw("0")).toBeNull();
    expect(parsePositiveKrw("-1")).toBeNull();
    expect(parsePositiveKrw("1000.5")).toBeNull();
    expect(parsePositiveKrw("abc")).toBeNull();
  });
});
