import type { CreatorStatus } from "@/lib/admin/creator-core";
import type { RequestStatus } from "@/lib/requests/status";

export type AccountProfileSource = {
  profileDisplayName?: string | null;
  profileAvatarUrl?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AccountProfileSummary = {
  displayName: string;
  avatarUrl: string | null;
};

export type RequestSummary = {
  totalCount: number;
  activeCount: number;
};

export type CreatorActivitySummary = {
  status: CreatorStatus;
  displayName: string;
  publishedListingCount: number;
  nonArchivedListingCount: number;
};

const activeRequestStatuses = new Set<RequestStatus>([
  "submitted",
  "checking",
  "payment_ready",
  "paid",
  "in_progress",
]);

export function buildLoginHref(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function buildAccountProfileSummary(
  source: AccountProfileSource,
): AccountProfileSummary {
  const metadataDisplayName =
    stringMetadata(source.metadata, "name") ??
    stringMetadata(source.metadata, "nickname") ??
    stringMetadata(source.metadata, "full_name") ??
    stringMetadata(source.metadata, "preferred_username");
  const metadataAvatarUrl =
    stringMetadata(source.metadata, "avatar_url") ??
    stringMetadata(source.metadata, "picture");

  return {
    displayName:
      cleanString(source.profileDisplayName) ??
      metadataDisplayName ??
      "Pyda 사용자",
    avatarUrl: cleanString(source.profileAvatarUrl) ?? metadataAvatarUrl,
  };
}

export function summarizeRequests(
  requests: Array<{ status: RequestStatus }>,
): RequestSummary {
  return {
    totalCount: requests.length,
    activeCount: requests.filter((request) =>
      activeRequestStatuses.has(request.status),
    ).length,
  };
}

export function buildCreatorActivitySummary(
  creator: CreatorActivitySummary | null,
) {
  if (!creator) {
    return {
      kind: "none" as const,
      title: "크리에이터 프로필 없음",
      description:
        "내 콘텐츠의 광고 자리를 판매해보세요. 유튜브나 인스타그램에서 제공할 광고 방식과 가격을 직접 정할 수 있습니다.",
    };
  }

  if (creator.status === "published") {
    return {
      kind: "published" as const,
      title: creator.displayName,
      description: `광고 상품 ${creator.nonArchivedListingCount}개 · 공개 중 ${creator.publishedListingCount}개`,
      managementHref: "/creator",
    };
  }

  return {
    kind: "existing" as const,
    title: creator.displayName,
    description: creatorStatusDescription(creator.status),
    managementHref: null,
  };
}

export function getProfileInitial(displayName: string) {
  return displayName.trim().slice(0, 1) || "P";
}

function creatorStatusDescription(status: CreatorStatus) {
  if (status === "draft") {
    return "등록 검토 중입니다. 채널과 광고 상품을 확인하고 있습니다.";
  }

  if (status === "hidden") {
    return "현재 크리에이터 프로필이 숨김 상태입니다.";
  }

  return "현재 크리에이터 프로필이 보관 상태입니다.";
}

function stringMetadata(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  return cleanString(metadata?.[key]);
}

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
