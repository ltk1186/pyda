import {
  buildAdminListingInsertPayload,
  buildAdminListingUpdatePayload,
  getExtensionForMimeType,
  validateAdminListingBase,
  validateImageFile,
  type AdminListingFormErrors,
  type ListingPlatform,
  type ListingStatus,
} from "@/lib/admin/listing-core";
import {
  cleanSocialLinks,
  isValidCreatorSlug,
  validateSocialLinks,
  type CreatorSocialLinks,
} from "@/lib/admin/creator-core";

export const maxAvatarImageBytes = 5 * 1024 * 1024;
export const maxAvatarImageSide = 1200;

export type CreatorProfileFormInput = {
  displayName: string;
  slug: string;
  bio: string | null;
  socialLinks: CreatorSocialLinks;
};

export type CreatorProfileFormErrors = Partial<
  Record<
    "displayName" | "slug" | "youtube" | "instagram" | "blog" | "tiktok",
    string
  >
>;

export type CreatorProfileUpdatePayload = {
  slug: string;
  display_name: string;
  bio: string | null;
  social_links: CreatorSocialLinks;
};

export type CreatorListingFormInput = {
  title: string;
  slug: string;
  platform: ListingPlatform;
  channelName: string | null;
  channelUrl: string | null;
  audienceSize: number | null;
  adFormat: string;
  description: string | null;
  deliverables: string[];
  priceKrw: number;
  status: ListingStatus;
};

export type CreatorListingInsertPayload = ReturnType<
  typeof buildCreatorListingInsertPayload
>;

export type CreatorListingUpdatePayload = ReturnType<
  typeof buildCreatorListingUpdatePayload
>;

export type CreatorListingFormErrors = Omit<AdminListingFormErrors, "creatorId">;

export function validateCreatorProfileForm(input: Record<string, unknown>) {
  const errors: CreatorProfileFormErrors = {};
  const displayName = stringValue(input.displayName).trim();
  const slug = stringValue(input.slug).trim();

  if (!displayName) {
    errors.displayName = "활동명을 입력해주세요.";
  }

  if (!isValidCreatorSlug(slug)) {
    errors.slug =
      "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있고 하이픈으로 시작하거나 끝날 수 없습니다.";
  }

  Object.assign(
    errors,
    validateSocialLinks({
      youtube: input.youtube,
      instagram: input.instagram,
      blog: input.blog,
      tiktok: input.tiktok,
    }),
  );

  if (Object.keys(errors).length > 0) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      displayName,
      slug,
      bio: nullableStringValue(input.bio),
      socialLinks: cleanSocialLinks({
        youtube: input.youtube,
        instagram: input.instagram,
        blog: input.blog,
        tiktok: input.tiktok,
      }),
    } satisfies CreatorProfileFormInput,
  };
}

export function buildCreatorProfileUpdatePayload(
  input: CreatorProfileFormInput,
): CreatorProfileUpdatePayload {
  return {
    slug: input.slug,
    display_name: input.displayName,
    bio: input.bio,
    social_links: input.socialLinks,
  };
}

export function validateAvatarFile(file: File) {
  return validateImageFile(file);
}

export function buildAvatarStorageObjectPath(params: {
  creatorId: string;
  extension: string;
  randomId: string;
}) {
  const extension = params.extension.replace(/^\./, "").toLowerCase();
  return `creators/${params.creatorId}/avatar/${params.randomId}.${extension}`;
}

export function getAvatarExtensionForMimeType(type: string) {
  return getExtensionForMimeType(type);
}

export function getPreviousStorageAvatarToCleanup(params: {
  previousAvatarPath: string | null;
  nextAvatarPath: string | null;
}) {
  if (
    !params.previousAvatarPath ||
    params.previousAvatarPath.startsWith("/") ||
    params.previousAvatarPath === params.nextAvatarPath
  ) {
    return null;
  }

  return params.previousAvatarPath;
}

export function validateCreatorListingBase(input: {
  title: string;
  slug: string;
  platform: string;
  channelUrl: string | null;
  audienceSize: string | null;
  adFormat: string;
  deliverablesText: string | null;
  priceKrw: string | null;
  status: string;
  imageCount: number;
}) {
  const result = validateAdminListingBase({
    creatorId: "owned-creator",
    ...input,
  });

  if (!result.ok) {
    const { creatorId: _creatorId, ...errors } = result.errors;
    void _creatorId;
    return {
      ok: false as const,
      errors,
    };
  }

  const { creatorId: _creatorId, ...data } = result.data;
  void _creatorId;
  return {
    ok: true as const,
    data,
  };
}

export function buildCreatorListingInsertPayload(params: {
  input: CreatorListingFormInput;
  creatorId: string;
  listingId: string;
  imagePaths: string[];
  publishedAt: string | null;
}) {
  return buildAdminListingInsertPayload({
    input: {
      ...params.input,
      creatorId: params.creatorId,
      isSample: false,
    },
    listingId: params.listingId,
    imagePaths: params.imagePaths,
    publishedAt: params.publishedAt,
  });
}

export function buildCreatorListingUpdatePayload(params: {
  input: CreatorListingFormInput;
  imagePaths: string[];
  publishedAt: string | null;
}) {
  const { is_sample: _isSample, ...payload } = buildAdminListingUpdatePayload({
    input: {
      ...params.input,
      isSample: false,
    },
    imagePaths: params.imagePaths,
    publishedAt: params.publishedAt,
  });
  void _isSample;
  return payload;
}

export function canEditOwnedListing(input: {
  ownerCreatorId: string;
  listingCreatorId: string;
}) {
  return input.ownerCreatorId === input.listingCreatorId;
}

export function canCompleteCreatorOnboarding(input: {
  creatorStatus: string;
  onboardedAt: string | null;
  nonArchivedListingCount: number;
}) {
  if (input.onboardedAt) {
    return {
      ok: false as const,
      message: "이미 온보딩이 완료되었습니다.",
    };
  }

  if (input.creatorStatus === "archived") {
    return {
      ok: false as const,
      message: "보관된 크리에이터는 온보딩을 완료할 수 없습니다.",
    };
  }

  if (input.nonArchivedListingCount < 1) {
    return {
      ok: false as const,
      message: "광고 상품을 최소 1개 등록한 뒤 온보딩을 완료할 수 있습니다.",
    };
  }

  return {
    ok: true as const,
  };
}

export function buildOnboardingCompletePayload(input: { nowIso: string }) {
  return {
    onboarded_at: input.nowIso,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableStringValue(value: unknown) {
  const string = stringValue(value).trim();
  return string.length > 0 ? string : null;
}
