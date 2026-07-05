import { describe, expect, it } from "vitest";
import {
  buildRequestInsertPayload,
  formatRequestStatus,
  validateRequestForm,
} from "./index";

describe("request form validation", () => {
  it("rejects missing required fields and invalid date order", () => {
    const result = validateRequestForm({
      brandName: "",
      contactName: "",
      contactChannel: "DM",
      contactValue: "",
      campaignBrief: "",
      preferredStartDate: "2026-07-10",
      preferredEndDate: "2026-07-09",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.brandName).toBeTruthy();
      expect(result.errors.contactChannel).toBeTruthy();
      expect(result.errors.preferredEndDate).toBeTruthy();
    }
  });

  it("accepts a valid request form", () => {
    const result = validateRequestForm({
      brandName: "Pyda",
      contactName: "담당자",
      contactChannel: "이메일",
      contactValue: "hello@example.com",
      campaignBrief: "신규 캠페인을 소개하고 싶습니다.",
      preferredStartDate: "",
      preferredEndDate: "",
    });

    expect(result.ok).toBe(true);
  });

  it("builds trusted insert payload without client-controlled protected fields", () => {
    const result = validateRequestForm({
      brandName: "Pyda",
      contactName: "담당자",
      contactChannel: "카카오톡",
      contactValue: "pyda",
      campaignBrief: "브랜드 소개",
      preferredStartDate: null,
      preferredEndDate: null,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const payload = buildRequestInsertPayload(
      result.data,
      "user-id",
      "listing-id",
    );

    expect(payload.advertiser_user_id).toBe("user-id");
    expect(payload.status).toBe("submitted");
    expect(payload.quoted_amount_krw).toBeNull();
    expect(payload.admin_notes).toBeNull();
  });
});

describe("formatRequestStatus", () => {
  it("formats request status in Korean for users", () => {
    expect(formatRequestStatus("submitted")).toBe("요청 접수");
    expect(formatRequestStatus("payment_ready")).toBe("결제 가능");
    expect(formatRequestStatus("cancelled")).toBe("취소");
  });
});
