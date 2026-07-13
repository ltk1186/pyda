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
export const onboardingAdSlots = [
  "youtube_video_mention",
  "youtube_pinned_comment",
  "youtube_description_top",
  "instagram_reel_mention",
  "instagram_profile_or_highlight",
] as const;

export type OnboardingPlatform = (typeof onboardingPlatforms)[number];
export type OnboardingInventoryType =
  (typeof onboardingInventoryTypes)[number];
export type OnboardingOptionKey = (typeof onboardingOptionKeys)[number];
export type OnboardingTurnaroundDays =
  (typeof onboardingTurnaroundDays)[number];
export type OnboardingMentionSeconds =
  (typeof onboardingMentionSeconds)[number];
export type OnboardingStoryCount = (typeof onboardingStoryCounts)[number];
export type OnboardingAdSlot = (typeof onboardingAdSlots)[number];
export type InstagramExistingPlacement = "profile_link" | "highlight";

export type OnboardingChannelProfile = {
  name: string;
  url: string;
  audienceSize: number;
};

export type OnboardingChannelProfiles = Partial<
  Record<"youtube" | "instagram", OnboardingChannelProfile>
>;

export type OnboardingAdSlotDefinition = {
  id: OnboardingAdSlot;
  title: string;
  description: string;
  example: string;
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
};

export type CreatorOnboardingInput = {
  adSlot: OnboardingAdSlot;
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
    | "adSlot"
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

export const onboardingAdSlotDefinitions: Record<
  OnboardingAdSlot,
  OnboardingAdSlotDefinition
> = {
  youtube_video_mention: {
    id: "youtube_video_mention",
    title: "YouTube 영상 속 짧은 소개",
    description: "새 영상 안에서 매장, 상품 또는 서비스를 짧게 소개합니다.",
    example: "제주 여행 영상 안에서 카페를 30초 소개",
    platform: "YouTube",
    inventoryType: "new_content",
  },
  youtube_pinned_comment: {
    id: "youtube_pinned_comment",
    title: "YouTube 기존 영상 고정댓글",
    description: "이미 올라간 영상의 고정댓글에 광고 문구와 링크를 올립니다.",
    example: "조회가 계속 나오는 여행 영상에 카페 예약 링크 고정",
    platform: "YouTube",
    inventoryType: "existing_traffic",
  },
  youtube_description_top: {
    id: "youtube_description_top",
    title: "YouTube 기존 영상 설명란 상단",
    description: "기존 영상 설명란 첫 부분에 광고 문구와 링크를 올립니다.",
    example: "영상 설명란 첫 줄에 할인 코드와 예약 링크 표시",
    platform: "YouTube",
    inventoryType: "existing_traffic",
  },
  instagram_reel_mention: {
    id: "instagram_reel_mention",
    title: "Instagram 릴스 속 짧은 소개",
    description: "새 릴스 안에서 매장 방문이나 상품 사용 모습을 소개합니다.",
    example: "릴스 안에서 카페 방문 장면과 메뉴 소개",
    platform: "Instagram",
    inventoryType: "new_content",
  },
  instagram_profile_or_highlight: {
    id: "instagram_profile_or_highlight",
    title: "Instagram 프로필 링크 또는 하이라이트",
    description: "프로필 링크나 하이라이트에 광고를 일정 기간 노출합니다.",
    example: "프로필에서 예약 링크를 보여주거나 하이라이트에 광고 보관",
    platform: "Instagram",
    inventoryType: "existing_traffic",
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

export function getOnboardingAdSlotDefinition(slot: OnboardingAdSlot) {
  return onboardingAdSlotDefinitions[slot];
}

export function getOnboardingSlotSelection(input: {
  adSlot: OnboardingAdSlot;
  instagramPlacement?: InstagramExistingPlacement;
}) {
  const definition = getOnboardingAdSlotDefinition(input.adSlot);
  let optionKeys: OnboardingOptionKey[] = [];

  if (input.adSlot === "youtube_pinned_comment") {
    optionKeys = ["pinned_comment"];
  } else if (input.adSlot === "youtube_description_top") {
    optionKeys = ["description_top"];
  } else if (input.adSlot === "instagram_profile_or_highlight") {
    optionKeys = [input.instagramPlacement ?? "profile_link"];
  }

  return {
    platform: definition.platform,
    inventoryType: definition.inventoryType,
    optionKeys,
  };
}

export function getRecommendedOnboardingPrice(input: {
  platform: OnboardingPlatform;
  inventoryType: OnboardingInventoryType;
}) {
  return onboardingRecommendedPrices[`${input.platform}:${input.inventoryType}`];
}

export function getOnboardingSlotPriceChoices(slot: OnboardingAdSlot) {
  if (slot === "youtube_video_mention") {
    return ["10", "20", "30"];
  }
  if (slot === "instagram_reel_mention") {
    return ["5", "10", "20"];
  }
  if (slot === "instagram_profile_or_highlight") {
    return ["1", "3", "5"];
  }
  return ["3", "5", "10"];
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

export function validateCreatorOnboardingInput(input: Record<string, unknown>) {
  const errors: CreatorOnboardingErrors = {};
  const adSlotValue = stringValue(input.adSlot);
  const displayName = stringValue(input.displayName).trim();
  const submittedPlatform = stringValue(input.selectedPlatform);
  const submittedInventoryType = stringValue(input.inventoryType);
  const rawOptionError = validateRawOnboardingOptionKeys(input.optionKeys);
  const submittedOptionKeys = normalizeOptionKeys(input.optionKeys);
  const placementFeeKrw = parsePlacementFeeKrw(input.placementFeeManwon);
  const productionFeeKrwInput = parseProductionFeeKrw(
    input.productionFeeManwon,
  );
  const turnaroundDays = parseRequiredNonNegativeInteger(input.turnaroundDays);
  const maintenanceDays = parseRequiredPositiveInteger(input.maintenanceDays);
  const mentionSeconds = parseRequiredNonNegativeInteger(input.mentionSeconds);

  if (!isOnboardingAdSlot(adSlotValue)) {
    errors.adSlot = "열어둘 광고 자리를 선택해주세요.";
  }

  const selection = isOnboardingAdSlot(adSlotValue)
    ? deriveSelectionFromSubmittedOptions(adSlotValue, submittedOptionKeys)
    : null;

  if (selection?.error) {
    errors.optionKeys = selection.error;
  }

  if (rawOptionError) {
    errors.optionKeys = rawOptionError;
  }

  if (
    selection &&
    (submittedPlatform !== selection.platform ||
      submittedInventoryType !== selection.inventoryType)
  ) {
    errors.adSlot = "선택한 광고 자리 정보가 올바르지 않습니다.";
  }

  if (!displayName) {
    errors.displayName = "활동명을 입력해주세요.";
  }

  const selectedPlatform = selection?.platform ?? null;
  const inventoryType = selection?.inventoryType ?? null;
  const optionKeys = selection?.optionKeys ?? [];
  const channelProfiles = selectedPlatform
    ? validateSelectedChannelProfile(input, selectedPlatform, errors)
    : {};

  if (
    selectedPlatform &&
    !channelProfiles[toChannelKey(selectedPlatform)]
  ) {
    errors.selectedPlatform = `${selectedPlatform} 채널 정보를 완성해주세요.`;
  }

  if (placementFeeKrw === null) {
    errors.placementFeeManwon =
      "희망 가격은 0.5만원부터 99만원까지 0.5만원 단위로 입력해주세요.";
  }

  if (inventoryType === "new_content") {
    if (productionFeeKrwInput === null) {
      errors.productionFeeManwon =
        "제작비는 0원부터 99만원까지 0.5만원 단위로 입력해주세요.";
    }

    if (!isOnboardingTurnaroundDays(turnaroundDays)) {
      errors.turnaroundDays = "제작 가능 기간을 선택해주세요.";
    }
  }

  if (
    inventoryType === "existing_traffic" &&
    !isValidMaintenanceDays(maintenanceDays)
  ) {
    errors.maintenanceDays = "광고 유지 기간은 1일부터 365일 사이의 정수여야 합니다.";
  }

  if (
    adSlotValue === "youtube_video_mention" &&
    !isOnboardingMentionSeconds(mentionSeconds)
  ) {
    errors.mentionSeconds = "소개 시간을 선택해주세요.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isOnboardingAdSlot(adSlotValue) ||
    !selection ||
    selection.error ||
    !selectedPlatform ||
    !inventoryType ||
    placementFeeKrw === null
  ) {
    return { ok: false as const, errors };
  }

  const productionFeeKrw =
    inventoryType === "new_content" ? (productionFeeKrwInput ?? 0) : 0;

  return {
    ok: true as const,
    data: {
      adSlot: adSlotValue,
      displayName,
      bio: nullableStringValue(input.bio),
      selectedPlatform,
      channelProfiles,
      inventoryType,
      optionKeys,
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
        adSlotValue === "youtube_video_mention" &&
        isOnboardingMentionSeconds(mentionSeconds)
          ? mentionSeconds
          : null,
      storyCount: null,
    } satisfies CreatorOnboardingInput,
  };
}

export function getOnboardingErrorStep(errors: CreatorOnboardingErrors) {
  const step1Fields: Array<keyof CreatorOnboardingErrors> = [
    "adSlot",
    "inventoryType",
    "optionKeys",
    "mentionSeconds",
  ];
  const step2Fields: Array<keyof CreatorOnboardingErrors> = [
    "displayName",
    "selectedPlatform",
    "youtubeName",
    "youtubeUrl",
    "youtubeAudienceSize",
    "instagramName",
    "instagramUrl",
    "instagramAudienceSize",
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
  const selectedChannel =
    params.input.channelProfiles[toChannelKey(params.input.selectedPlatform)];

  if (!selectedChannel) {
    throw new Error("Selected onboarding channel is missing.");
  }

  const presentation = getOnboardingSlotPresentation(params.input);

  return {
    id: params.listingId,
    creator_id: params.creatorId,
    slug: params.listingSlug,
    title: presentation.title,
    platform: params.input.selectedPlatform,
    channel_name: selectedChannel.name,
    channel_url: selectedChannel.url,
    audience_size: selectedChannel.audienceSize,
    ad_format: presentation.adFormat,
    description: presentation.description,
    deliverables: presentation.deliverables,
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
    story_count: null,
  };
}

export function getOnboardingSlotPresentation(input: Pick<
  CreatorOnboardingInput,
  "adSlot" | "mentionSeconds" | "optionKeys" | "maintenanceDays" | "turnaroundDays"
>) {
  if (input.adSlot === "youtube_video_mention") {
    const seconds = input.mentionSeconds ?? 15;
    return {
      title: `YouTube 영상 속 ${seconds}초 소개`,
      adFormat: `${seconds}초 직접 소개`,
      description: "새 YouTube 영상 안에서 매장, 상품 또는 서비스를 짧게 소개하는 광고 자리입니다.",
      deliverables: [
        `영상 안에서 약 ${seconds}초 직접 소개`,
        input.turnaroundDays ? `${input.turnaroundDays}일 이내 제작` : "새 영상 제작",
      ],
    };
  }

  if (input.adSlot === "youtube_pinned_comment") {
    return existingSlotPresentation({
      title: "YouTube 기존 영상 고정댓글 광고",
      adFormat: "고정댓글 광고",
      description: "기존 YouTube 영상의 고정댓글에 광고 문구와 링크를 올리는 광고 자리입니다.",
      deliverable: "기존 영상 고정댓글에 광고 문구와 링크 게시",
      maintenanceDays: input.maintenanceDays,
    });
  }

  if (input.adSlot === "youtube_description_top") {
    return existingSlotPresentation({
      title: "YouTube 기존 영상 설명란 상단 광고",
      adFormat: "설명란 상단 광고",
      description: "기존 YouTube 영상 설명란 첫 부분에 광고 문구와 링크를 올리는 광고 자리입니다.",
      deliverable: "기존 영상 설명란 상단에 광고 문구와 링크 게시",
      maintenanceDays: input.maintenanceDays,
    });
  }

  if (input.adSlot === "instagram_reel_mention") {
    return {
      title: "Instagram 릴스 속 짧은 소개",
      adFormat: "릴스 속 직접 소개",
      description: "새 Instagram 릴스 안에서 매장 방문이나 상품 사용 모습을 소개하는 광고 자리입니다.",
      deliverables: [
        "릴스 안에서 매장 방문 또는 상품 사용 소개",
        input.turnaroundDays ? `${input.turnaroundDays}일 이내 제작` : "새 릴스 제작",
      ],
    };
  }

  const isHighlight = input.optionKeys.includes("highlight");
  return existingSlotPresentation({
    title: isHighlight
      ? "Instagram 스토리 하이라이트 광고"
      : "Instagram 프로필 링크 광고",
    adFormat: isHighlight ? "스토리 하이라이트 광고" : "프로필 링크 광고",
    description: isHighlight
      ? "Instagram 스토리 하이라이트에 광고를 노출하는 자리입니다."
      : "Instagram 프로필 링크에 광고주 링크를 노출하는 자리입니다.",
    deliverable: isHighlight
      ? "스토리 하이라이트에 광고 노출"
      : "프로필에 광고주 링크 노출",
    maintenanceDays: input.maintenanceDays,
  });
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

export function isOnboardingAdSlot(value: string): value is OnboardingAdSlot {
  return onboardingAdSlots.includes(value as OnboardingAdSlot);
}

export function toChannelKey(platform: OnboardingPlatform) {
  return platform === "YouTube" ? "youtube" : "instagram";
}

function deriveSelectionFromSubmittedOptions(
  adSlot: OnboardingAdSlot,
  optionKeys: OnboardingOptionKey[],
) {
  const definition = getOnboardingAdSlotDefinition(adSlot);
  let expectedOptions: OnboardingOptionKey[] = [];

  if (adSlot === "youtube_pinned_comment") {
    expectedOptions = ["pinned_comment"];
  } else if (adSlot === "youtube_description_top") {
    expectedOptions = ["description_top"];
  } else if (adSlot === "instagram_profile_or_highlight") {
    const placements = optionKeys.filter(
      (key): key is InstagramExistingPlacement =>
        key === "profile_link" || key === "highlight",
    );
    if (placements.length !== 1 || optionKeys.length !== 1) {
      return {
        platform: definition.platform,
        inventoryType: definition.inventoryType,
        optionKeys: [],
        error: "프로필 링크 또는 스토리 하이라이트 중 하나를 선택해주세요.",
      };
    }
    expectedOptions = placements;
  }

  if (
    adSlot !== "instagram_profile_or_highlight" &&
    (optionKeys.length !== expectedOptions.length ||
      optionKeys.some((key, index) => key !== expectedOptions[index]))
  ) {
    return {
      platform: definition.platform,
      inventoryType: definition.inventoryType,
      optionKeys: [],
      error: "선택한 광고 자리에 맞지 않는 옵션이 포함되어 있습니다.",
    };
  }

  return {
    platform: definition.platform,
    inventoryType: definition.inventoryType,
    optionKeys: expectedOptions,
    error: null,
  };
}

function validateSelectedChannelProfile(
  input: Record<string, unknown>,
  platform: OnboardingPlatform,
  errors: CreatorOnboardingErrors,
) {
  const channelProfiles: OnboardingChannelProfiles = {};
  const isYoutube = platform === "YouTube";
  const profile = parseChannelProfile({
    platform,
    name: input[isYoutube ? "youtubeName" : "instagramName"],
    url: input[isYoutube ? "youtubeUrl" : "instagramUrl"],
    audienceSize: input[
      isYoutube ? "youtubeAudienceSize" : "instagramAudienceSize"
    ],
    nameField: isYoutube ? "youtubeName" : "instagramName",
    urlField: isYoutube ? "youtubeUrl" : "instagramUrl",
    audienceField: isYoutube
      ? "youtubeAudienceSize"
      : "instagramAudienceSize",
    errors,
  });

  if (profile) {
    channelProfiles[toChannelKey(platform)] = profile;
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

  if (!name) {
    params.errors[params.nameField] =
      params.platform === "YouTube"
        ? "YouTube 채널명을 입력해주세요."
        : "Instagram 계정명을 입력해주세요.";
  }

  if (!url) {
    params.errors[params.urlField] = `${params.platform} 채널 주소를 입력해주세요.`;
  } else if (!isValidAbsoluteHttpUrl(url)) {
    params.errors[params.urlField] =
      `${params.platform} 채널 주소는 http 또는 https 전체 URL이어야 합니다.`;
  } else if (!isMatchingPlatformUrl(params.platform, url)) {
    params.errors[params.urlField] = `${params.platform} 채널 주소를 입력해주세요.`;
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

  return { name, url, audienceSize: parsedAudienceSize };
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

function existingSlotPresentation(input: {
  title: string;
  adFormat: string;
  description: string;
  deliverable: string;
  maintenanceDays: number | null;
}) {
  return {
    title: input.title,
    adFormat: input.adFormat,
    description: input.description,
    deliverables: [
      input.deliverable,
      input.maintenanceDays ? `${input.maintenanceDays}일 유지` : "기간 협의",
    ],
  };
}

function normalizeOptionKeys(value: unknown): OnboardingOptionKey[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const optionKeys: OnboardingOptionKey[] = [];

  for (const rawValue of rawValues) {
    const optionKey = stringValue(rawValue);
    if (!isOnboardingOptionKey(optionKey) || optionKeys.includes(optionKey)) {
      continue;
    }
    optionKeys.push(optionKey);
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

function isValidMaintenanceDays(value: number | null) {
  return value !== null && value >= 1 && value <= 365;
}

function isMatchingPlatformUrl(platform: OnboardingPlatform, value: string) {
  const hostname = new URL(value).hostname.toLowerCase();
  if (platform === "YouTube") {
    return (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be"
    );
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
