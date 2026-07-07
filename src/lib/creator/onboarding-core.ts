import { isValidAbsoluteHttpUrl } from "@/lib/admin/url";

export const onboardingPlatforms = ["YouTube", "Instagram"] as const;
export const onboardingInventoryTypes = [
  "new_content",
  "existing_traffic",
] as const;
export const onboardingOptionKeys = [
  "coupon_code",
  "dedicated_link",
  "brand_badge",
  "story_3",
] as const;
export const onboardingTurnaroundDays = [7, 14, 30] as const;

export type OnboardingPlatform = (typeof onboardingPlatforms)[number];
export type OnboardingInventoryType =
  (typeof onboardingInventoryTypes)[number];
export type OnboardingOptionKey = (typeof onboardingOptionKeys)[number];
export type OnboardingTurnaroundDays =
  (typeof onboardingTurnaroundDays)[number];

export type OnboardingTemplate = {
  title: string;
  adFormat: string;
  baseDeliverables: string[];
  optionKeys: OnboardingOptionKey[];
};

export type CreatorOnboardingInput = {
  displayName: string;
  platform: OnboardingPlatform;
  channelUrl: string;
  audienceSize: number;
  bio: string | null;
  inventoryType: OnboardingInventoryType;
  optionKeys: OnboardingOptionKey[];
  placementFeeKrw: number;
  productionFeeKrw: number;
  turnaroundDays: OnboardingTurnaroundDays | null;
  sourceContentUrl: string | null;
  recent30dViews: number | null;
};

export type CreatorOnboardingErrors = Partial<
  Record<
    | "displayName"
    | "platform"
    | "channelUrl"
    | "audienceSize"
    | "inventoryType"
    | "optionKeys"
    | "placementFeeKrw"
    | "productionFeeKrw"
    | "turnaroundDays"
    | "sourceContentUrl"
    | "recent30dViews"
    | "image",
    string
  >
>;

export type CreatorOnboardingListingPayload = {
  id: string;
  creator_id: string;
  slug: string;
  title: string;
  platform: OnboardingPlatform;
  channel_name: string;
  channel_url: string;
  audience_size: number;
  ad_format: string;
  description: string;
  deliverables: string[];
  price_krw: number;
  image_paths: string[];
  status: "draft";
  is_sample: false;
  published_at: null;
  inventory_type: OnboardingInventoryType;
  placement_fee_krw: number;
  production_fee_krw: number;
  option_keys: OnboardingOptionKey[];
  turnaround_days: OnboardingTurnaroundDays | null;
  source_content_url: string | null;
  recent_30d_views: number | null;
  maintenance_days: 30 | null;
};

export type CreatorOnboardingCreatorPayload = {
  id: string;
  owner_user_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_path: null;
  social_links: Partial<Record<"youtube" | "instagram", string>>;
  status: "draft";
  is_sample: false;
  onboarded_at: string;
  claimed_at: null;
  claim_token_hash: null;
  claim_expires_at: null;
  is_founding: false;
  founding_granted_at: null;
};

const onboardingTemplates: Record<
  `${OnboardingPlatform}:${OnboardingInventoryType}`,
  OnboardingTemplate
> = {
  "YouTube:new_content": {
    title: "YouTube 영상 내 15초 직접 소개 + 하단 CTA",
    adFormat: "15초 직접 소개 + 하단 CTA",
    baseDeliverables: [
      "영상 안에서 약 15초 직접 소개",
      "하단 CTA에 매장명, 혜택 또는 링크 표시",
    ],
    optionKeys: ["coupon_code", "dedicated_link", "brand_badge"],
  },
  "Instagram:new_content": {
    title: "Instagram 릴스 방문 리뷰 1편",
    adFormat: "릴스 방문 리뷰 1편",
    baseDeliverables: ["직접 방문하거나 사용한 모습을 담은 릴스 1편"],
    optionKeys: ["story_3", "coupon_code", "dedicated_link"],
  },
  "YouTube:existing_traffic": {
    title: "기존 YouTube 영상 고정댓글 + 설명란 광고",
    adFormat: "고정댓글 + 설명란 상단 광고",
    baseDeliverables: ["고정댓글 광고", "설명란 상단 광고", "30일 유지"],
    optionKeys: ["coupon_code"],
  },
  "Instagram:existing_traffic": {
    title: "Instagram 프로필 링크 30일",
    adFormat: "프로필 링크 광고",
    baseDeliverables: ["프로필에 광고주 링크 노출", "30일 유지"],
    optionKeys: ["coupon_code"],
  },
};

export const onboardingOptionLabels: Record<OnboardingOptionKey, string> = {
  coupon_code: "쿠폰코드 포함",
  dedicated_link: "전용 링크 포함",
  brand_badge: "상단 브랜드 배지",
  story_3: "스토리 3건 추가",
};

export function getOnboardingTemplate(
  platform: OnboardingPlatform,
  inventoryType: OnboardingInventoryType,
) {
  return onboardingTemplates[`${platform}:${inventoryType}`];
}

export function getAllowedOnboardingOptions(input: {
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
}) {
  return getOnboardingTemplate(input.platform, input.inventoryType).optionKeys;
}

export function validateCreatorOnboardingInput(input: Record<string, unknown>) {
  const errors: CreatorOnboardingErrors = {};
  const displayName = stringValue(input.displayName).trim();
  const platform = stringValue(input.platform);
  const channelUrl = stringValue(input.channelUrl).trim();
  const audienceSize = parseRequiredNonNegativeInteger(input.audienceSize);
  const inventoryType = stringValue(input.inventoryType);
  const placementFeeKrw = parseRequiredPositiveInteger(input.placementFeeKrw);
  const rawProductionFeeKrw = parseRequiredNonNegativeInteger(input.productionFeeKrw);
  const sourceContentUrl = nullableStringValue(input.sourceContentUrl);
  const recent30dViews = parseRequiredNonNegativeInteger(input.recent30dViews);
  const rawTurnaroundDays = parseRequiredNonNegativeInteger(input.turnaroundDays);

  if (!displayName) {
    errors.displayName = "활동명 또는 채널명을 입력해주세요.";
  }

  if (!isOnboardingPlatform(platform)) {
    errors.platform = "주요 플랫폼을 선택해주세요.";
  }

  if (!isValidAbsoluteHttpUrl(channelUrl)) {
    errors.channelUrl = "채널 주소는 http 또는 https로 시작하는 전체 URL이어야 합니다.";
  } else if (isOnboardingPlatform(platform) && !isMatchingPlatformUrl(platform, channelUrl)) {
    errors.channelUrl = `${platform} 채널 주소를 입력해주세요.`;
  }

  if (audienceSize === null) {
    errors.audienceSize = "구독자 또는 팔로워 수는 0 이상의 정수여야 합니다.";
  }

  if (!isOnboardingInventoryType(inventoryType)) {
    errors.inventoryType = "광고 상품을 선택해주세요.";
  }

  if (placementFeeKrw === null) {
    errors.placementFeeKrw = "광고 자리값은 0보다 큰 원 단위 정수여야 합니다.";
  }

  if (
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "new_content" &&
    rawProductionFeeKrw === null
  ) {
    errors.productionFeeKrw = "제작비는 0 이상의 원 단위 정수여야 합니다.";
  }

  if (
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "new_content" &&
    !isOnboardingTurnaroundDays(rawTurnaroundDays)
  ) {
    errors.turnaroundDays = "제작 가능 기간을 선택해주세요.";
  }

  if (
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "existing_traffic"
  ) {
    if (!sourceContentUrl || !isValidAbsoluteHttpUrl(sourceContentUrl)) {
      errors.sourceContentUrl =
        "광고를 붙일 기존 콘텐츠 주소는 http 또는 https 전체 URL이어야 합니다.";
    }

    if (recent30dViews === null) {
      errors.recent30dViews = "최근 30일 조회수 또는 도달수는 0 이상의 정수여야 합니다.";
    }
  }

  const rawOptionError = validateRawOnboardingOptionKeys(input.optionKeys);

  if (rawOptionError) {
    errors.optionKeys = rawOptionError;
  }

  if (
    Object.keys(errors).length > 0 ||
    !isOnboardingPlatform(platform) ||
    !isOnboardingInventoryType(inventoryType) ||
    audienceSize === null ||
    placementFeeKrw === null
  ) {
    return { ok: false as const, errors };
  }

  const productionFeeKrw =
    inventoryType === "new_content" ? rawProductionFeeKrw : 0;
  const turnaroundDays =
    inventoryType === "new_content" && isOnboardingTurnaroundDays(rawTurnaroundDays)
      ? rawTurnaroundDays
      : null;
  const selectedOptionKeys = normalizeOptionKeys(input.optionKeys);
  const optionError = validateOnboardingOptions({
    platform,
    inventoryType,
    optionKeys: selectedOptionKeys,
  });

  if (optionError || productionFeeKrw === null) {
    return {
      ok: false as const,
      errors: {
        ...errors,
        ...(optionError ? { optionKeys: optionError } : {}),
        ...(productionFeeKrw === null
          ? { productionFeeKrw: "제작비는 0 이상의 원 단위 정수여야 합니다." }
          : {}),
      },
    };
  }

  return {
    ok: true as const,
    data: {
      displayName,
      platform,
      channelUrl,
      audienceSize,
      bio: nullableStringValue(input.bio),
      inventoryType,
      optionKeys: selectedOptionKeys,
      placementFeeKrw,
      productionFeeKrw,
      turnaroundDays,
      sourceContentUrl:
        inventoryType === "existing_traffic" ? sourceContentUrl : null,
      recent30dViews:
        inventoryType === "existing_traffic" ? recent30dViews : null,
    } satisfies CreatorOnboardingInput,
  };
}

export function validateOnboardingOptions(input: {
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
  optionKeys: OnboardingOptionKey[];
}) {
  const allowed = new Set(getAllowedOnboardingOptions(input));

  for (const optionKey of input.optionKeys) {
    if (!allowed.has(optionKey)) {
      return "선택한 광고 상품에서 사용할 수 없는 옵션이 포함되어 있습니다.";
    }
  }

  return null;
}

export function buildCreatorOnboardingCreatorPayload(params: {
  input: CreatorOnboardingInput;
  creatorId: string;
  ownerUserId: string;
  creatorSlug: string;
  nowIso: string;
}): CreatorOnboardingCreatorPayload {
  return {
    id: params.creatorId,
    owner_user_id: params.ownerUserId,
    slug: params.creatorSlug,
    display_name: params.input.displayName,
    bio: params.input.bio,
    avatar_path: null,
    social_links:
      params.input.platform === "YouTube"
        ? { youtube: params.input.channelUrl }
        : { instagram: params.input.channelUrl },
    status: "draft",
    is_sample: false,
    onboarded_at: params.nowIso,
    claimed_at: null,
    claim_token_hash: null,
    claim_expires_at: null,
    is_founding: false,
    founding_granted_at: null,
  };
}

export function buildCreatorOnboardingListingPayload(params: {
  input: CreatorOnboardingInput;
  creatorId: string;
  listingId: string;
  listingSlug: string;
  imagePaths: string[];
}): CreatorOnboardingListingPayload {
  const template = getOnboardingTemplate(
    params.input.platform,
    params.input.inventoryType,
  );
  const optionDeliverables = params.input.optionKeys.map(
    (key) => onboardingOptionLabels[key],
  );

  return {
    id: params.listingId,
    creator_id: params.creatorId,
    slug: params.listingSlug,
    title: template.title,
    platform: params.input.platform,
    channel_name: params.input.displayName,
    channel_url: params.input.channelUrl,
    audience_size: params.input.audienceSize,
    ad_format: template.adFormat,
    description: buildListingDescription(params.input),
    deliverables: [...template.baseDeliverables, ...optionDeliverables],
    price_krw: calculateOnboardingTotalPrice(params.input),
    image_paths: params.imagePaths,
    status: "draft",
    is_sample: false,
    published_at: null,
    inventory_type: params.input.inventoryType,
    placement_fee_krw: params.input.placementFeeKrw,
    production_fee_krw: params.input.productionFeeKrw,
    option_keys: params.input.optionKeys,
    turnaround_days: params.input.turnaroundDays,
    source_content_url: params.input.sourceContentUrl,
    recent_30d_views: params.input.recent30dViews,
    maintenance_days:
      params.input.inventoryType === "existing_traffic" ? 30 : null,
  };
}

export function calculateOnboardingTotalPrice(input: {
  placementFeeKrw: number;
  productionFeeKrw: number;
}) {
  return input.placementFeeKrw + input.productionFeeKrw;
}

export function buildGeneratedCreatorSlug(randomId: string) {
  return `creator-${normalizeRandomSuffix(randomId)}`;
}

export function buildGeneratedListingSlug(params: {
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
  randomId: string;
}) {
  const platform = params.platform === "YouTube" ? "youtube" : "instagram";
  const inventory =
    params.inventoryType === "new_content" ? "new-content" : "existing-traffic";
  return `${platform}-${inventory}-${normalizeRandomSuffix(params.randomId)}`;
}

export function isOnboardingPlatform(value: string): value is OnboardingPlatform {
  return onboardingPlatforms.includes(value as OnboardingPlatform);
}

export function isOnboardingInventoryType(
  value: string,
): value is OnboardingInventoryType {
  return onboardingInventoryTypes.includes(value as OnboardingInventoryType);
}

export function isOnboardingOptionKey(
  value: string,
): value is OnboardingOptionKey {
  return onboardingOptionKeys.includes(value as OnboardingOptionKey);
}

function normalizeOptionKeys(value: unknown): OnboardingOptionKey[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const optionKeys: OnboardingOptionKey[] = [];

  for (const rawValue of rawValues) {
    const value = stringValue(rawValue);

    if (!isOnboardingOptionKey(value) || optionKeys.includes(value)) {
      continue;
    }

    optionKeys.push(value);
  }

  return optionKeys;
}

function validateRawOnboardingOptionKeys(value: unknown) {
  const rawValues = Array.isArray(value) ? value : [value];

  for (const rawValue of rawValues) {
    const optionKey = stringValue(rawValue);

    if (optionKey && !isOnboardingOptionKey(optionKey)) {
      return "알 수 없는 옵션이 포함되어 있습니다.";
    }
  }

  return null;
}

function isOnboardingTurnaroundDays(
  value: number | null,
): value is OnboardingTurnaroundDays {
  return onboardingTurnaroundDays.includes(value as OnboardingTurnaroundDays);
}

function isMatchingPlatformUrl(platform: OnboardingPlatform, value: string) {
  const hostname = new URL(value).hostname.toLowerCase();

  if (platform === "YouTube") {
    return hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
  }

  return hostname === "instagram.com" || hostname.endsWith(".instagram.com");
}

function buildListingDescription(input: CreatorOnboardingInput) {
  if (input.inventoryType === "new_content") {
    return `${input.displayName} 채널의 새 콘텐츠 안에서 브랜드, 공간 또는 상품을 자연스럽게 소개하는 광고 상품입니다.`;
  }

  return `${input.displayName} 채널의 기존 콘텐츠 트래픽을 활용해 30일 동안 광고를 노출하는 상품입니다.`;
}

function parseRequiredPositiveInteger(value: unknown) {
  const string = stringValue(value).trim();

  if (!/^[1-9]\d*$/.test(string)) {
    return null;
  }

  const number = Number(string);
  return Number.isSafeInteger(number) ? number : null;
}

function parseRequiredNonNegativeInteger(value: unknown) {
  const string = stringValue(value).trim();

  if (!/^(0|[1-9]\d*)$/.test(string)) {
    return null;
  }

  const number = Number(string);
  return Number.isSafeInteger(number) ? number : null;
}

function nullableStringValue(value: unknown) {
  const string = stringValue(value).trim();
  return string ? string : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeRandomSuffix(randomId: string) {
  return randomId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}
