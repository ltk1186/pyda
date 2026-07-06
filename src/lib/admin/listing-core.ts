import { isValidCreatorSlug } from "./creator-core";
import { isValidAbsoluteHttpUrl } from "./url";

export const listingPlatforms = [
  "YouTube",
  "Instagram",
  "네이버 블로그",
  "TikTok",
] as const;

export const listingStatuses = [
  "draft",
  "published",
  "hidden",
  "archived",
] as const;

export const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maxListingImages = 3;
export const maxListingImageBytes = 5 * 1024 * 1024;

export type ListingPlatform = (typeof listingPlatforms)[number];
export type ListingStatus = (typeof listingStatuses)[number];
export type AllowedImageMimeType = (typeof allowedImageMimeTypes)[number];

export type AdminListingFormInput = {
  creatorId: string;
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
  imagePaths: string[];
  status: ListingStatus;
  isSample: boolean;
};

export type ImageOrderItem =
  | {
      kind: "existing";
      path: string;
    }
  | {
      kind: "new";
      index: number;
    };

export type ImageOrderMode = "create" | "update";

export type AdminListingInsertPayload = {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  platform: ListingPlatform;
  channel_name: string | null;
  channel_url: string | null;
  audience_size: number | null;
  ad_format: string;
  description: string | null;
  deliverables: string[];
  price_krw: number;
  image_paths: string[];
  status: ListingStatus;
  is_sample: boolean;
  published_at: string | null;
};

export type AdminListingUpdatePayload = Omit<
  AdminListingInsertPayload,
  "id" | "creator_id"
>;

export type AdminListingFormErrors = Partial<
  Record<
    | "creatorId"
    | "title"
    | "slug"
    | "platform"
    | "channelUrl"
    | "audienceSize"
    | "adFormat"
    | "deliverables"
    | "priceKrw"
    | "images"
    | "status",
    string
  >
>;

export function parseDeliverables(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parsePositiveInteger(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function parseNonNegativeInteger(value: string | null) {
  if (!value || value.trim() === "") {
    return null;
  }

  if (!/^(0|[1-9]\d*)$/.test(value.trim())) {
    return undefined;
  }

  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

export function validateImageCount(status: ListingStatus, imageCount: number) {
  if (imageCount > maxListingImages) {
    return "이미지는 최대 3장까지 등록할 수 있습니다.";
  }

  if (status === "published" && imageCount < 1) {
    return "공개 상태의 광고 상품은 이미지가 최소 1장 필요합니다.";
  }

  return null;
}

export function isAllowedImageMimeType(value: string): value is AllowedImageMimeType {
  return allowedImageMimeTypes.includes(value as AllowedImageMimeType);
}

export function validateImageFile(file: File) {
  if (!isAllowedImageMimeType(file.type)) {
    return "JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.";
  }

  if (file.size > maxListingImageBytes) {
    return "이미지는 1장당 최대 5MB까지 업로드할 수 있습니다.";
  }

  return null;
}

export function formatListingStatus(status: ListingStatus) {
  const labels: Record<ListingStatus, string> = {
    draft: "작성 중",
    published: "공개",
    hidden: "숨김",
    archived: "보관",
  };

  return labels[status] ?? status;
}

export function assertExistingImageSubset(
  currentImagePaths: string[],
  requestedImagePaths: string[],
) {
  const current = new Set(currentImagePaths);
  return requestedImagePaths.every((path) => current.has(path));
}

export function validateImageOrder(params: {
  currentImagePaths: string[];
  mode: ImageOrderMode;
  newImageCount: number;
  rawOrder: string[];
}) {
  const existing = new Set(params.currentImagePaths);
  const seenExisting = new Set<string>();
  const seenNew = new Set<number>();
  const order: ImageOrderItem[] = [];

  for (const token of params.rawOrder) {
    if (token.startsWith("existing:")) {
      const path = token.slice("existing:".length);

      if (params.mode === "create") {
        return {
          ok: false as const,
          message: "신규 광고 상품에는 기존 이미지를 사용할 수 없습니다.",
        };
      }

      if (!existing.has(path)) {
        return {
          ok: false as const,
          message: "현재 상품에 연결된 기존 이미지만 유지할 수 있습니다.",
        };
      }

      if (seenExisting.has(path)) {
        return {
          ok: false as const,
          message: "같은 기존 이미지를 중복으로 사용할 수 없습니다.",
        };
      }

      seenExisting.add(path);
      order.push({ kind: "existing", path });
      continue;
    }

    if (token.startsWith("new:")) {
      const rawIndex = token.slice("new:".length);

      if (!/^(0|[1-9]\d*)$/.test(rawIndex)) {
        return {
          ok: false as const,
          message: "새 이미지 순서 값이 올바르지 않습니다.",
        };
      }

      const index = Number(rawIndex);

      if (!Number.isSafeInteger(index) || index >= params.newImageCount) {
        return {
          ok: false as const,
          message: "존재하지 않는 새 이미지 순서가 포함되어 있습니다.",
        };
      }

      if (seenNew.has(index)) {
        return {
          ok: false as const,
          message: "같은 새 이미지를 중복으로 사용할 수 없습니다.",
        };
      }

      seenNew.add(index);
      order.push({ kind: "new", index });
      continue;
    }

    return {
      ok: false as const,
      message: "알 수 없는 이미지 순서 값이 포함되어 있습니다.",
    };
  }

  for (let index = 0; index < params.newImageCount; index += 1) {
    if (!seenNew.has(index)) {
      return {
        ok: false as const,
        message: "선택한 모든 새 이미지는 순서에 정확히 한 번 포함되어야 합니다.",
      };
    }
  }

  const countError = order.length > maxListingImages
    ? "이미지는 최대 3장까지 등록할 수 있습니다."
    : null;

  if (countError) {
    return {
      ok: false as const,
      message: countError,
    };
  }

  return {
    ok: true as const,
    order,
  };
}

export function buildOrderedImagePaths(params: {
  currentImagePaths: string[];
  uploadedImagePaths: string[];
  imageOrder: ImageOrderItem[];
}) {
  return params.imageOrder.flatMap((item) => {
    if (item.kind === "existing") {
      return params.currentImagePaths.includes(item.path) ? [item.path] : [];
    }

    const uploadedPath = params.uploadedImagePaths[item.index];
    return uploadedPath ? [uploadedPath] : [];
  });
}

export function buildStorageObjectPath(params: {
  creatorId: string;
  listingId: string;
  extension: string;
  randomId: string;
}) {
  const extension = params.extension.replace(/^\./, "").toLowerCase();
  return `creators/${params.creatorId}/listings/${params.listingId}/${params.randomId}.${extension}`;
}

export function getExtensionForMimeType(type: string) {
  if (type === "image/jpeg") {
    return "jpg";
  }

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return null;
}

export function nextPublishedAt(params: {
  currentPublishedAt: string | null;
  previousStatus: ListingStatus | null;
  nextStatus: ListingStatus;
  nowIso: string;
}) {
  if (params.currentPublishedAt) {
    return params.currentPublishedAt;
  }

  if (params.previousStatus !== "published" && params.nextStatus === "published") {
    return params.nowIso;
  }

  return null;
}

export function validateAdminListingBase(input: {
  creatorId: string;
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
  const errors: AdminListingFormErrors = {};
  const priceKrw = parsePositiveInteger(input.priceKrw);
  const audienceSize = parseNonNegativeInteger(input.audienceSize);

  if (!input.creatorId.trim()) {
    errors.creatorId = "크리에이터를 선택해주세요.";
  }

  if (!input.title.trim()) {
    errors.title = "상품명을 입력해주세요.";
  }

  if (!isValidCreatorSlug(input.slug.trim())) {
    errors.slug = "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.";
  }

  if (!isListingPlatform(input.platform)) {
    errors.platform = "플랫폼을 선택해주세요.";
  }

  if (input.channelUrl && !isValidAbsoluteHttpUrl(input.channelUrl)) {
    errors.channelUrl = "채널 URL은 http 또는 https로 시작하는 전체 URL이어야 합니다.";
  }

  if (audienceSize === undefined) {
    errors.audienceSize = "구독자 또는 팔로워 수는 0 이상의 정수여야 합니다.";
  }

  if (!input.adFormat.trim()) {
    errors.adFormat = "광고 형식을 입력해주세요.";
  }

  if (!isListingStatus(input.status)) {
    errors.status = "공개 상태를 선택해주세요.";
  }

  if (!priceKrw) {
    errors.priceKrw = "가격은 0보다 큰 원 단위 정수여야 합니다.";
  }

  const imageCountError = isListingStatus(input.status)
    ? validateImageCount(input.status, input.imageCount)
    : null;

  if (imageCountError) {
    errors.images = imageCountError;
  }

  if (
    Object.keys(errors).length > 0 ||
    !isListingPlatform(input.platform) ||
    !isListingStatus(input.status) ||
    !priceKrw ||
    audienceSize === undefined
  ) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      creatorId: input.creatorId.trim(),
      title: input.title.trim(),
      slug: input.slug.trim(),
      platform: input.platform,
      channelUrl: input.channelUrl,
      audienceSize,
      adFormat: input.adFormat.trim(),
      deliverables: parseDeliverables(input.deliverablesText),
      priceKrw,
      status: input.status,
    },
  };
}

export function buildAdminListingInsertPayload(params: {
  input: Omit<AdminListingFormInput, "imagePaths">;
  listingId: string;
  imagePaths: string[];
  publishedAt: string | null;
}): AdminListingInsertPayload {
  return {
    id: params.listingId,
    creator_id: params.input.creatorId,
    title: params.input.title,
    slug: params.input.slug,
    platform: params.input.platform,
    channel_name: params.input.channelName,
    channel_url: params.input.channelUrl,
    audience_size: params.input.audienceSize,
    ad_format: params.input.adFormat,
    description: params.input.description,
    deliverables: params.input.deliverables,
    price_krw: params.input.priceKrw,
    image_paths: params.imagePaths,
    status: params.input.status,
    is_sample: params.input.isSample,
    published_at: params.publishedAt,
  };
}

export function buildAdminListingUpdatePayload(params: {
  input: Omit<AdminListingFormInput, "creatorId" | "imagePaths">;
  imagePaths: string[];
  publishedAt: string | null;
}): AdminListingUpdatePayload {
  return {
    title: params.input.title,
    slug: params.input.slug,
    platform: params.input.platform,
    channel_name: params.input.channelName,
    channel_url: params.input.channelUrl,
    audience_size: params.input.audienceSize,
    ad_format: params.input.adFormat,
    description: params.input.description,
    deliverables: params.input.deliverables,
    price_krw: params.input.priceKrw,
    image_paths: params.imagePaths,
    status: params.input.status,
    is_sample: params.input.isSample,
    published_at: params.publishedAt,
  };
}

function isListingPlatform(value: string): value is ListingPlatform {
  return listingPlatforms.includes(value as ListingPlatform);
}

function isListingStatus(value: string): value is ListingStatus {
  return listingStatuses.includes(value as ListingStatus);
}
