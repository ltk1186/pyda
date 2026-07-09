import type { RequestFormInput } from "@/lib/requests";
import {
  customAdBudgetLabels,
  customAdContactMethodLabels,
  customAdTimingLabels,
  type CustomAdRequestInput,
} from "@/lib/custom-ad-requests/core";

export const telegramMessageMaxLength = 4096;
const targetMessageLength = 3800;
const omittedLabel = "\n\n내용 일부 생략";

export type NewRequestMessageInput = {
  requestId: string;
  request: RequestFormInput;
  listing: {
    title: string;
    platform: string;
    adFormat: string;
    creator: {
      displayName: string;
    };
  };
  appBaseUrl: string | null;
};

export function buildNewRequestTelegramMessage(input: NewRequestMessageInput) {
  const adminUrl = input.appBaseUrl
    ? `${input.appBaseUrl}/admin/requests/${input.requestId}`
    : null;

  const build = (campaignBrief: string) =>
    [
      "[Pyda 신규 광고 요청]",
      "",
      `브랜드명: ${input.request.brandName}`,
      `담당자명: ${input.request.contactName}`,
      `연락 방식: ${input.request.contactChannel}`,
      `연락처: ${input.request.contactValue}`,
      "",
      `광고 상품명: ${input.listing.title}`,
      `크리에이터명: ${input.listing.creator.displayName}`,
      `플랫폼: ${input.listing.platform}`,
      `광고 형식: ${input.listing.adFormat}`,
      "",
      `희망 시작일: ${input.request.preferredStartDate ?? "미정"}`,
      `희망 종료일: ${input.request.preferredEndDate ?? "미정"}`,
      "",
      "광고 요청 내용:",
      campaignBrief,
      ...(adminUrl ? ["", `관리자 요청 상세 링크: ${adminUrl}`] : []),
    ].join("\n");

  const fullMessage = build(input.request.campaignBrief);

  if (fullMessage.length <= targetMessageLength) {
    return fullMessage;
  }

  const emptyBriefMessage = build("");
  const allowedBriefLength = Math.max(
    0,
    targetMessageLength - emptyBriefMessage.length - omittedLabel.length,
  );
  const truncatedBrief = `${input.request.campaignBrief.slice(
    0,
    allowedBriefLength,
  )}${omittedLabel}`;
  const truncatedMessage = build(truncatedBrief);

  return truncatedMessage.length <= telegramMessageMaxLength
    ? truncatedMessage
    : truncatedMessage.slice(0, telegramMessageMaxLength - omittedLabel.length) + omittedLabel;
}

export function shouldAttemptRequestNotification(input: {
  insertedRequestId: string | null | undefined;
  insertFailed: boolean;
}) {
  return !input.insertFailed && Boolean(input.insertedRequestId);
}

export type CustomAdRequestMessageInput = {
  requestId: string;
  request: CustomAdRequestInput;
};

export function buildCustomAdRequestTelegramMessage(
  input: CustomAdRequestMessageInput,
) {
  const build = (requestDetails: string) =>
    [
      "[Pyda 맞춤 광고 문의]",
      "",
      `문의 ID: ${input.requestId}`,
      `광고 대상: ${input.request.advertisedItem}`,
      `원하는 광고: ${requestDetails}`,
      `크리에이터 조건: ${input.request.creatorPreferences ?? "없음"}`,
      `예산: ${customAdBudgetLabels[input.request.budgetRange]}`,
      `희망 시기: ${customAdTimingLabels[input.request.desiredTiming]}`,
      `연락: ${customAdContactMethodLabels[input.request.contactMethod]}`,
      `전화번호: ${input.request.phone}`,
    ].join("\n");

  const fullMessage = build(input.request.requestDetails);

  if (fullMessage.length <= targetMessageLength) {
    return fullMessage;
  }

  const emptyDetailsMessage = build("");
  const allowedDetailsLength = Math.max(
    0,
    targetMessageLength - emptyDetailsMessage.length - omittedLabel.length,
  );
  const truncatedDetails = `${input.request.requestDetails.slice(
    0,
    allowedDetailsLength,
  )}${omittedLabel}`;
  const truncatedMessage = build(truncatedDetails);

  return truncatedMessage.length <= telegramMessageMaxLength
    ? truncatedMessage
    : truncatedMessage.slice(0, telegramMessageMaxLength - omittedLabel.length) + omittedLabel;
}
