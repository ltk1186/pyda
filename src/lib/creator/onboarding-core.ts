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
  "pinned_comment",
  "description_top",
  "profile_link",
  "highlight",
] as const;
export const onboardingTurnaroundDays = [7, 14, 30] as const;
export const onboardingMentionSeconds = [15, 30, 60] as const;
export const onboardingStoryCounts = [1, 2, 3] as const;

export type OnboardingPlatform = (typeof onboardingPlatforms)[number];
export type OnboardingInventoryType =
  (typeof onboardingInventoryTypes)[number];
export type OnboardingOptionKey = (typeof onboardingOptionKeys)[number];
export type OnboardingTurnaroundDays =
  (typeof onboardingTurnaroundDays)[number];
export type OnboardingMentionSeconds =
  (typeof onboardingMentionSeconds)[number];
export type OnboardingStoryCount = (typeof onboardingStoryCounts)[number];

export type OnboardingChannelProfile = {
  name: string;
  url: string;
  audienceSize: number;
};

export type OnboardingChannelProfiles = Partial<
  Record<"youtube" | "instagram", OnboardingChannelProfile>
>;

export type OnboardingTemplate = {
  heading: string;
  description: string;
  example: string;
  baseDeliverables: string[];
  optionKeys: OnboardingOptionKey[];
};

export type CreatorOnboardingInput = {
  displayName: string;
  bio: string | null;
  selectedPlatform: OnboardingPlatform;
  channelProfiles: OnboardingChannelProfiles;
  inventoryType: OnboardingInventoryType;
  optionKeys: OnboardingOptionKey[];
  placementFeeKrw: number;
  productionFeeKrw: number;
  turnaroundDays: OnboardingTurnaroundDays | null;
  maintenanceDays: number | null;
  mentionSeconds: OnboardingMentionSeconds | null;
  storyCount: OnboardingStoryCount | null;
};

export type CreatorOnboardingErrors = Partial<
  Record<
    | "displayName"
    | "selectedPlatform"
    | "youtubeName"
    | "youtubeUrl"
    | "youtubeAudienceSize"
    | "instagramName"
    | "instagramUrl"
    | "instagramAudienceSize"
    | "inventoryType"
    | "optionKeys"
    | "placementFeeManwon"
    | "productionFeeManwon"
    | "turnaroundDays"
    | "maintenanceDays"
    | "mentionSeconds"
    | "storyCount"
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
  source_content_url: null;
  recent_30d_views: null;
  maintenance_days: number | null;
  mention_seconds: OnboardingMentionSeconds | null;
  story_count: OnboardingStoryCount | null;
};

export type CreatorOnboardingCreatorPayload = {
  id: string;
  owner_user_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_path: null;
  social_links: Partial<Record<"youtube" | "instagram", string>>;
  channel_profiles: Record<string, unknown>;
  status: "draft";
  is_sample: false;
  onboarded_at: string;
  claimed_at: null;
  claim_token_hash: null;
  claim_expires_at: null;
  is_founding: false;
  founding_granted_at: null;
};

const manwon = 10_000;
const minPlacementFeeKrw = 5_000;
const maxOnboardingFeeKrw = 990_000;

const onboardingTemplates: Record<
  `${OnboardingPlatform}:${OnboardingInventoryType}`,
  OnboardingTemplate
> = {
  "YouTube:new_content": {
    heading: "새 영상 안에서 직접 소개하기",
    description:
      "앞으로 만드는 YouTube 영상 안에서 광고주의 매장, 상품 또는 서비스를 직접 소개합니다.",
    example: "제주 여행 영상 안에서 카페를 30초 소개",
    baseDeliverables: [
      "영상 안에서 크리에이터가 직접 소개",
      "매장명, 혜택 또는 링크를 화면에 표시",
    ],
    optionKeys: ["coupon_code", "dedicated_link", "brand_badge"],
  },
  "Instagram:new_content": {
    heading: "새 릴스로 방문이나 사용 경험 소개하기",
    description:
      "직접 방문하거나 사용한 모습을 Instagram 릴스 1편으로 소개합니다.",
    example: "릴스 1편에서 매장 방문이나 제품 사용 소개",
    baseDeliverables: ["릴스 1편 제작", "방문 또는 사용 장면 포함"],
    optionKeys: ["story_3", "coupon_code", "dedicated_link"],
  },
  "YouTube:existing_traffic": {
    heading: "기존 영상에 광고 추가하기",
    description: "이미 올라가 있고 지금도 사람들이 보는 영상에 광고를 추가합니다.",
    example: "기존 영상의 고정댓글이나 설명란 상단에 광고 추가",
    baseDeliverables: [],
    optionKeys: ["pinned_comment", "description_top"],
  },
  "Instagram:existing_traffic": {
    heading: "기존 Instagram 계정에 광고 노출하기",
    description:
      "새 릴스를 만들지 않고, 현재 계정을 방문하는 사람들이 광고를 볼 수 있게 합니다.",
    example: "프로필 링크나 하이라이트에 광고 노출",
    baseDeliverables: [],
    optionKeys: ["profile_link", "highlight"],
  },
};

export const onboardingRecommendedPrices: Record<
  `${OnboardingPlatform}:${OnboardingInventoryType}`,
  { placementFeeManwon: string; productionFeeManwon: string }
> = {
  "YouTube:new_content": {
    placementFeeManwon: "10",
    productionFeeManwon: "20",
  },
  "Instagram:new_content": {
    placementFeeManwon: "5",
    productionFeeManwon: "10",
  },
  "YouTube:existing_traffic": {
    placementFeeManwon: "3",
    productionFeeManwon: "0",
  },
  "Instagram:existing_traffic": {
    placementFeeManwon: "1",
    productionFeeManwon: "0",
  },
};

export const onboardingOptionLabels: Record<OnboardingOptionKey, string> = {
  coupon_code: "쿠폰코드 포함",
  dedicated_link: "전용 링크 포함",
  brand_badge: "상단 브랜드 배지",
  story_3: "스토리 추가",
  pinned_comment: "고정댓글에 광고 올리기",
  description_top: "영상 설명란 상단에 광고 올리기",
  profile_link: "프로필에 광고주 링크 올리기",
  highlight: "스토리 하이라이트에 광고 남기기",
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

export function getRecommendedOnboardingPrice(input: {
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
}) {
  return onboardingRecommendedPrices[`${input.platform}:${input.inventoryType}`];
}

export function applyRecommendedOnboardingPriceValues(input: {
  currentPlacementFeeManwon: string;
  currentProductionFeeManwon: string;
  placementFeeTouched: boolean;
  productionFeeTouched: boolean;
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
}) {
  const recommended = getRecommendedOnboardingPrice(input);

  return {
    placementFeeManwon: input.placementFeeTouched
      ? input.currentPlacementFeeManwon
      : recommended.placementFeeManwon,
    productionFeeManwon:
      input.productionFeeTouched || input.inventoryType !== "new_content"
        ? input.currentProductionFeeManwon
        : recommended.productionFeeManwon,
  };
}

export function inferOnboardingSelectedPlatform(input: {
  current: OnboardingPlatform;
  youtubeComplete: boolean;
  instagramComplete: boolean;
}): OnboardingPlatform {
  if (input.instagramComplete && !input.youtubeComplete) {
    return "Instagram";
  }

  if (input.youtubeComplete && !input.instagramComplete) {
    return "YouTube";
  }

  return input.current;
}

export function validateCreatorOnboardingInput(input: Record<string, unknown>) {
  const errors: CreatorOnboardingErrors = {};
  const displayName = stringValue(input.displayName).trim();
  const selectedPlatform = stringValue(input.selectedPlatform);
  const inventoryType = stringValue(input.inventoryType);
  const placementFeeKrw = parsePlacementFeeKrw(input.placementFeeManwon);
  const productionFeeKrwInput = parseProductionFeeKrw(
    input.productionFeeManwon,
  );
  const turnaroundDays = parseRequiredNonNegativeInteger(input.turnaroundDays);
  const maintenanceDays = parseRequiredPositiveInteger(input.maintenanceDays);
  const mentionSeconds = parseRequiredNonNegativeInteger(input.mentionSeconds);
  const storyCount = parseRequiredNonNegativeInteger(input.storyCount);

  if (!displayName) {
    errors.displayName = "활동명을 입력해주세요.";
  }

  if (!isOnboardingPlatform(selectedPlatform)) {
    errors.selectedPlatform = "첫 광고 상품을 등록할 채널을 선택해주세요.";
  }

  if (!isOnboardingInventoryType(inventoryType)) {
    errors.inventoryType = "광고 방식을 선택해주세요.";
  }

  const channelProfiles = validateChannelProfiles(input, errors);

  if (Object.keys(channelProfiles).length === 0) {
    errors.selectedPlatform =
      errors.selectedPlatform ?? "YouTube 또는 Instagram 채널을 하나 이상 입력해주세요.";
  }

  if (
    isOnboardingPlatform(selectedPlatform) &&
    !channelProfiles[toChannelKey(selectedPlatform)]
  ) {
    errors.selectedPlatform = `${selectedPlatform} 채널 정보를 완성해주세요.`;
  }

  if (placementFeeKrw === null) {
    errors.placementFeeManwon =
      "광고 자리값은 0.5만원부터 99만원까지 0.5만원 단위로 입력해주세요.";
  }

  if (
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "new_content"
  ) {
    if (productionFeeKrwInput === null) {
      errors.productionFeeManwon =
        "제작비는 0원부터 99만원까지 0.5만원 단위로 입력해주세요.";
    }

    if (!isOnboardingTurnaroundDays(turnaroundDays)) {
      errors.turnaroundDays = "제작 가능 기간을 선택해주세요.";
    }
  }

  if (
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "existing_traffic" &&
    !isValidMaintenanceDays(maintenanceDays)
  ) {
    errors.maintenanceDays = "광고 유지 기간은 1일부터 365일 사이의 정수여야 합니다.";
  }

  if (
    isOnboardingPlatform(selectedPlatform) &&
    isOnboardingInventoryType(inventoryType) &&
    selectedPlatform === "YouTube" &&
    inventoryType === "new_content" &&
    !isOnboardingMentionSeconds(mentionSeconds)
  ) {
    errors.mentionSeconds = "직접 소개 시간을 선택해주세요.";
  }

  const selectedOptionKeys = normalizeOptionKeys(input.optionKeys);
  const optionError =
    validateRawOnboardingOptionKeys(input.optionKeys) ??
    (isOnboardingPlatform(selectedPlatform) &&
    isOnboardingInventoryType(inventoryType)
      ? validateOnboardingOptions({
          platform: selectedPlatform,
          inventoryType,
          optionKeys: selectedOptionKeys,
        })
      : null);

  if (optionError) {
    errors.optionKeys = optionError;
  }

  if (
    isOnboardingPlatform(selectedPlatform) &&
    isOnboardingInventoryType(inventoryType) &&
    selectedPlatform === "Instagram" &&
    inventoryType === "new_content" &&
    selectedOptionKeys.includes("story_3") &&
    !isOnboardingStoryCount(storyCount)
  ) {
    errors.storyCount = "추가할 스토리 수를 선택해주세요.";
  }

  if (
    isOnboardingPlatform(selectedPlatform) &&
    isOnboardingInventoryType(inventoryType) &&
    inventoryType === "existing_traffic" &&
    selectedOptionKeys.length === 0
  ) {
    errors.optionKeys = "기존 콘텐츠나 계정에 추가할 광고 위치를 하나 이상 선택해주세요.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isOnboardingPlatform(selectedPlatform) ||
    !isOnboardingInventoryType(inventoryType) ||
    placementFeeKrw === null
  ) {
    return { ok: false as const, errors };
  }

  const productionFeeKrw =
    inventoryType === "new_content" ? (productionFeeKrwInput ?? 0) : 0;

  return {
    ok: true as const,
    data: {
      displayName,
      bio: nullableStringValue(input.bio),
      selectedPlatform,
      channelProfiles,
      inventoryType,
      optionKeys: selectedOptionKeys,
      placementFeeKrw,
      productionFeeKrw,
      turnaroundDays:
        inventoryType === "new_content" &&
        isOnboardingTurnaroundDays(turnaroundDays)
          ? turnaroundDays
          : null,
      maintenanceDays:
        inventoryType === "existing_traffic" && maintenanceDays
          ? maintenanceDays
          : null,
      mentionSeconds:
        selectedPlatform === "YouTube" &&
        inventoryType === "new_content" &&
        isOnboardingMentionSeconds(mentionSeconds)
          ? mentionSeconds
          : null,
      storyCount:
        selectedPlatform === "Instagram" &&
        inventoryType === "new_content" &&
        selectedOptionKeys.includes("story_3") &&
        isOnboardingStoryCount(storyCount)
          ? storyCount
          : null,
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
      return "선택한 광고 방식에서 사용할 수 없는 옵션이 포함되어 있습니다.";
    }
  }

  return null;
}

export function getOnboardingErrorStep(errors: CreatorOnboardingErrors) {
  const step1Fields: Array<keyof CreatorOnboardingErrors> = [
    "displayName",
    "youtubeName",
    "youtubeUrl",
    "youtubeAudienceSize",
    "instagramName",
    "instagramUrl",
    "instagramAudienceSize",
  ];
  const step2Fields: Array<keyof CreatorOnboardingErrors> = [
    "selectedPlatform",
    "inventoryType",
    "optionKeys",
    "mentionSeconds",
    "storyCount",
  ];

  if (step1Fields.some((field) => errors[field])) {
    return 1;
  }

  if (step2Fields.some((field) => errors[field])) {
    return 2;
  }

  return 3;
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
    social_links: buildSocialLinks(params.input.channelProfiles),
    channel_profiles: buildChannelProfilesJson(params.input.channelProfiles),
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
    params.input.selectedPlatform,
    params.input.inventoryType,
  );
  const selectedChannel =
    params.input.channelProfiles[toChannelKey(params.input.selectedPlatform)];

  if (!selectedChannel) {
    throw new Error("Selected onboarding channel is missing.");
  }

  const deliverables = buildDeliverables({
    input: params.input,
    template,
  });

  return {
    id: params.listingId,
    creator_id: params.creatorId,
    slug: params.listingSlug,
    title: template.heading,
    platform: params.input.selectedPlatform,
    channel_name: selectedChannel.name,
    channel_url: selectedChannel.url,
    audience_size: selectedChannel.audienceSize,
    ad_format: template.heading,
    description: template.description,
    deliverables,
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
    source_content_url: null,
    recent_30d_views: null,
    maintenance_days: params.input.maintenanceDays,
    mention_seconds: params.input.mentionSeconds,
    story_count: params.input.storyCount,
  };
}

export function calculateOnboardingTotalPrice(input: {
  placementFeeKrw: number;
  productionFeeKrw: number;
}) {
  return input.placementFeeKrw + input.productionFeeKrw;
}

export function parseOnboardingManwonToKrw(value: unknown) {
  const string = stringValue(value).trim();

  if (!/^(0|[1-9]\d*)(?:\.5)?$/.test(string)) {
    return null;
  }

  const number = Number(string);
  const krw = number * manwon;

  return Number.isSafeInteger(krw) ? krw : null;
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

export function toChannelKey(platform: OnboardingPlatform) {
  return platform === "YouTube" ? "youtube" : "instagram";
}

function validateChannelProfiles(
  input: Record<string, unknown>,
  errors: CreatorOnboardingErrors,
) {
  const channelProfiles: OnboardingChannelProfiles = {};
  const youtube = parseChannelProfile({
    platform: "YouTube",
    name: input.youtubeName,
    url: input.youtubeUrl,
    audienceSize: input.youtubeAudienceSize,
    nameField: "youtubeName",
    urlField: "youtubeUrl",
    audienceField: "youtubeAudienceSize",
    errors,
  });
  const instagram = parseChannelProfile({
    platform: "Instagram",
    name: input.instagramName,
    url: input.instagramUrl,
    audienceSize: input.instagramAudienceSize,
    nameField: "instagramName",
    urlField: "instagramUrl",
    audienceField: "instagramAudienceSize",
    errors,
  });

  if (youtube) {
    channelProfiles.youtube = youtube;
  }

  if (instagram) {
    channelProfiles.instagram = instagram;
  }

  return channelProfiles;
}

function parseChannelProfile(params: {
  platform: OnboardingPlatform;
  name: unknown;
  url: unknown;
  audienceSize: unknown;
  nameField: "youtubeName" | "instagramName";
  urlField: "youtubeUrl" | "instagramUrl";
  audienceField: "youtubeAudienceSize" | "instagramAudienceSize";
  errors: CreatorOnboardingErrors;
}) {
  const name = stringValue(params.name).trim();
  const url = stringValue(params.url).trim();
  const audienceSize = stringValue(params.audienceSize).trim();
  const anyValue = Boolean(name || url || audienceSize);

  if (!anyValue) {
    return null;
  }

  if (!name) {
    params.errors[params.nameField] =
      `${params.platform} 채널명을 입력해주세요.`;
  }

  if (!url) {
    params.errors[params.urlField] =
      `${params.platform} 채널 주소를 입력해주세요.`;
  } else if (!isValidAbsoluteHttpUrl(url)) {
    params.errors[params.urlField] =
      `${params.platform} 채널 주소는 http 또는 https 전체 URL이어야 합니다.`;
  } else if (!isMatchingPlatformUrl(params.platform, url)) {
    params.errors[params.urlField] =
      `${params.platform} 채널 주소를 입력해주세요.`;
  }

  const parsedAudienceSize = parseRequiredNonNegativeInteger(audienceSize);

  if (parsedAudienceSize === null) {
    params.errors[params.audienceField] =
      params.platform === "YouTube"
        ? "YouTube 구독자 수를 입력해주세요."
        : "Instagram 팔로워 수를 입력해주세요.";
  }

  if (!name || !url || parsedAudienceSize === null) {
    return null;
  }

  return {
    name,
    url,
    audienceSize: parsedAudienceSize,
  };
}

function buildSocialLinks(channelProfiles: OnboardingChannelProfiles) {
  return {
    ...(channelProfiles.youtube ? { youtube: channelProfiles.youtube.url } : {}),
    ...(channelProfiles.instagram
      ? { instagram: channelProfiles.instagram.url }
      : {}),
  };
}

function buildChannelProfilesJson(channelProfiles: OnboardingChannelProfiles) {
  return {
    ...(channelProfiles.youtube
      ? {
          youtube: {
            name: channelProfiles.youtube.name,
            url: channelProfiles.youtube.url,
            audience_size: channelProfiles.youtube.audienceSize,
          },
        }
      : {}),
    ...(channelProfiles.instagram
      ? {
          instagram: {
            name: channelProfiles.instagram.name,
            url: channelProfiles.instagram.url,
            audience_size: channelProfiles.instagram.audienceSize,
          },
        }
      : {}),
  };
}

function buildDeliverables(params: {
  input: CreatorOnboardingInput;
  template: OnboardingTemplate;
}) {
  const deliverables = [...params.template.baseDeliverables];

  if (
    params.input.selectedPlatform === "YouTube" &&
    params.input.inventoryType === "new_content" &&
    params.input.mentionSeconds
  ) {
    deliverables[0] = `영상 안에서 약 ${params.input.mentionSeconds}초 직접 소개`;
  }

  for (const optionKey of params.input.optionKeys) {
    if (optionKey === "story_3" && params.input.storyCount) {
      deliverables.push(`스토리 ${params.input.storyCount}건 추가`);
      continue;
    }

    deliverables.push(onboardingOptionLabels[optionKey]);
  }

  if (
    params.input.inventoryType === "existing_traffic" &&
    params.input.maintenanceDays
  ) {
    deliverables.push(`${params.input.maintenanceDays}일 유지`);
  }

  return deliverables;
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

function isOnboardingMentionSeconds(
  value: number | null,
): value is OnboardingMentionSeconds {
  return onboardingMentionSeconds.includes(value as OnboardingMentionSeconds);
}

function isOnboardingStoryCount(
  value: number | null,
): value is OnboardingStoryCount {
  return onboardingStoryCounts.includes(value as OnboardingStoryCount);
}

function isValidMaintenanceDays(value: number | null) {
  return value !== null && value >= 1 && value <= 365;
}

function isMatchingPlatformUrl(platform: OnboardingPlatform, value: string) {
  const hostname = new URL(value).hostname.toLowerCase();

  if (platform === "YouTube") {
    return hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
  }

  return hostname === "instagram.com" || hostname.endsWith(".instagram.com");
}

function parseRequiredPositiveInteger(value: unknown) {
  const string = stringValue(value).trim();

  if (!/^[1-9]\d*$/.test(string)) {
    return null;
  }

  const number = Number(string);
  return Number.isSafeInteger(number) ? number : null;
}

function parsePlacementFeeKrw(value: unknown) {
  const krw = parseOnboardingManwonToKrw(value);

  if (
    krw === null ||
    krw < minPlacementFeeKrw ||
    krw > maxOnboardingFeeKrw
  ) {
    return null;
  }

  return krw;
}

function parseProductionFeeKrw(value: unknown) {
  const krw = parseOnboardingManwonToKrw(value);

  if (krw === null || krw < 0 || krw > maxOnboardingFeeKrw) {
    return null;
  }

  return krw;
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
