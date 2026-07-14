import type { ListingStatus } from "@/lib/admin/listing-core";

export const listingVisibilityPreferences = [
  "private_matching",
  "public_review",
] as const;

export type ListingVisibilityPreference =
  (typeof listingVisibilityPreferences)[number];

export function isListingVisibilityPreference(
  value: string,
): value is ListingVisibilityPreference {
  return listingVisibilityPreferences.includes(
    value as ListingVisibilityPreference,
  );
}

export function formatListingVisibilityPreference(
  preference: ListingVisibilityPreference,
) {
  return preference === "public_review" ? "메인 공개 신청" : "직접 매칭";
}

export function canAdminPublishListing(
  preference: ListingVisibilityPreference,
) {
  return preference === "public_review";
}

export function resolveCreatorListingState(input: {
  currentStatus: ListingStatus | null;
  currentPublishedAt: string | null;
  visibilityPreference: ListingVisibilityPreference;
}) {
  if (input.currentStatus === "archived") {
    return {
      status: "archived" as const,
      publishedAt: null,
    };
  }

  if (
    input.visibilityPreference === "public_review" &&
    input.currentStatus === "published"
  ) {
    return {
      status: "published" as const,
      publishedAt: input.currentPublishedAt,
    };
  }

  return {
    status: "draft" as const,
    publishedAt: null,
  };
}

export function getListingOperationState(input: {
  status: ListingStatus;
  visibilityPreference: ListingVisibilityPreference;
}) {
  if (input.status === "published") {
    return {
      key: "public" as const,
      label: "메인 공개 중",
      description: "광고주가 메인에서 이 광고 자리를 보고 문의할 수 있습니다.",
    };
  }

  if (input.status === "archived" || input.status === "hidden") {
    return {
      key: "inactive" as const,
      label: "노출 중지",
      description: "현재 광고주에게 노출되지 않는 광고 자리입니다.",
    };
  }

  if (input.visibilityPreference === "public_review") {
    return {
      key: "review" as const,
      label: "공개 검토 중",
      description:
        "메인 공개를 위해 내용을 확인하고 있습니다. 보통 1영업일 안에 확인합니다.",
    };
  }

  return {
    key: "matching" as const,
    label: "직접 매칭 중",
    description:
      "메인에는 공개되지 않습니다. 조건에 맞는 광고주가 있으면 Pyda가 먼저 연락드립니다.",
  };
}
