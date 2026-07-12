import { describe, expect, it } from "vitest";
import {
  buildCustomAdRequestTelegramMessage,
  buildNewRequestTelegramMessage,
  shouldAttemptRequestNotification,
  telegramMessageMaxLength,
  type NewRequestMessageInput,
} from "./request-message";

function input(overrides: Partial<NewRequestMessageInput> = {}): NewRequestMessageInput {
  return {
    requestId: "request-id",
    request: {
      brandName: "Pyda",
      contactName: "담당자",
      contactChannel: "이메일",
      contactValue: "hello@example.com",
      campaignBrief: "브랜드 소개를 진행하고 싶습니다.",
      preferredStartDate: null,
      preferredEndDate: null,
    },
    listing: {
      title: "제주 여행 영상 소개",
      platform: "YouTube",
      adFormat: "영상 내 30초 소개",
      creator: {
        displayName: "김제주",
      },
    },
    appBaseUrl: "https://pyda.io",
    ...overrides,
  };
}

describe("new request telegram message", () => {
  it("includes core request information as plain text", () => {
    const message = buildNewRequestTelegramMessage(input());

    expect(message).toContain("[Pyda 신규 광고 요청]");
    expect(message).toContain("브랜드명: Pyda");
    expect(message).toContain("담당자명: 담당자");
    expect(message).toContain("연락 방식: 이메일");
    expect(message).toContain("연락처: hello@example.com");
    expect(message).toContain("광고 상품명: 제주 여행 영상 소개");
    expect(message).toContain("크리에이터명: 김제주");
    expect(message).toContain("플랫폼: YouTube");
    expect(message).toContain("광고 형식: 영상 내 30초 소개");
    expect(message).toContain("광고 요청 내용:");
  });

  it("uses undecided text for missing preferred schedule", () => {
    const message = buildNewRequestTelegramMessage(input());

    expect(message).toContain("희망 시작일: 미정");
    expect(message).toContain("희망 종료일: 미정");
  });

  it("adds admin URL only when APP_BASE_URL is valid", () => {
    expect(buildNewRequestTelegramMessage(input())).toContain(
      "https://pyda.io/admin/requests/request-id",
    );
    expect(
      buildNewRequestTelegramMessage(input({ appBaseUrl: null })),
    ).not.toContain("/admin/requests/request-id");
  });

  it("truncates long campaign brief and stays under Telegram limit", () => {
    const message = buildNewRequestTelegramMessage(
      input({
        request: {
          ...input().request,
          campaignBrief: "긴 요청".repeat(3000),
        },
      }),
    );

    expect(message.length).toBeLessThanOrEqual(telegramMessageMaxLength);
    expect(message).toContain("내용 일부 생략");
  });

  it("keeps request notification after successful insert only", () => {
    expect(
      shouldAttemptRequestNotification({
        insertedRequestId: null,
        insertFailed: true,
      }),
    ).toBe(false);
    expect(
      shouldAttemptRequestNotification({
        insertedRequestId: "request-id",
        insertFailed: false,
      }),
    ).toBe(true);
  });
});

describe("custom ad request telegram message", () => {
  it("includes concierge demand information as plain text", () => {
    const message = buildCustomAdRequestTelegramMessage({
      requestId: "custom-request-id",
      request: {
        advertisedItem: "제주 애월의 작은 카페",
        requestDetails: "제주 여행 유튜버의 영상 안에서 30초 소개",
        creatorPreferences: "제주 여행 / YouTube",
        budgetRange: "100k_300k",
        desiredTiming: "within_1_month",
        contactMethod: "kakao",
        phone: "01012345678",
        privacyConsent: true,
        source: "talktalk_stay",
      },
    });

    expect(message).toContain("[Pyda 맞춤 광고 문의]");
    expect(message).toContain("문의 ID: custom-request-id");
    expect(message).toContain("유입 경로: talktalk_stay");
    expect(message).toContain("광고 대상: 제주 애월의 작은 카페");
    expect(message).toContain(
      "원하는 광고: 제주 여행 유튜버의 영상 안에서 30초 소개",
    );
    expect(message).toContain("크리에이터 조건: 제주 여행 / YouTube");
    expect(message).toContain("예산: 10만~30만원");
    expect(message).toContain("희망 시기: 1개월 안");
    expect(message).toContain("연락: 카카오톡");
    expect(message).toContain("전화번호: 01012345678");
  });
});
